/**
 * The public register on the landing page, end to end through the real UI:
 * submit -> shown as "In review" -> admin hides/shows -> applicant opts out/in -> admin approves -> "Verified".
 * Run against a local Supabase and a production build (`npm run build && npx playwright test`).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test, type Page } from "@playwright/test";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("E2E must run against local Supabase only.");

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";
const adminEmail = `reg-admin-${run}@example.test`;
const founderEmail = `reg-founder-${run}@example.test`;
const company = `Corrib${run}`;

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(feed|admin|application)/);
}

/** The landing page is statically cached: poll with reloads until the on-demand revalidation lands. */
async function expectOnLanding(page: Page, visible: boolean) {
  await expect
    .poll(async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      return await page.getByText(company, { exact: true }).count();
    }, { timeout: 20_000, intervals: [300, 600, 1000] })
    .toBe(visible ? 1 : 0);
}

test.describe.serial("public register (browser)", () => {
  let appId = "";

  test.beforeAll(async () => {
    const { data: a } = await admin.auth.admin.createUser({ email: adminEmail, password: PASSWORD, email_confirm: true, user_metadata: { full_name: "Reg Admin" } });
    await admin.from("profiles").update({ role: "super_admin", verification_status: "approved" }).eq("id", a.user!.id);

    const { data: f } = await admin.auth.admin.createUser({ email: founderEmail, password: PASSWORD, email_confirm: true, user_metadata: { full_name: "Reg Founder" } });
    const client = createClient(URL, ANON, { auth: { persistSession: false } });
    await client.auth.signInWithPassword({ email: founderEmail, password: PASSWORD });
    const { data, error } = await client.rpc("submit_application", {
      p: {
        applicant_type: "founder",
        profile: { full_name: "Reg Founder", linkedin_url: "https://linkedin.com/in/x", location: "Galway", headline: "CEO" },
        company_name: company, company_city: "Galway", company_website: `https://${company.toLowerCase()}.ie`,
        company_linkedin: `https://linkedin.com/company/${company.toLowerCase()}`, industry: "MarineTech", stage: "mvp", founded_year: 2025, team_size: 3,
        company_description: "Boats", linkedin_follower_count: 90, sample_post_urls: ["https://l.co/1", "https://l.co/2"], relationship_to_company: "Founder",
        founder_role: "CEO", interview: { problem: "a", why: "b", built: "c", challenge: "d", gain: "e", contribute: "f" },
      },
    });
    expect(error).toBeNull();
    appId = data as string;
    void f;
  });

  test("the applicant's company is listed as 'In review' (static page, nothing private)", async ({ browser, page }) => {
    // Going through the UI triggers the same on-demand revalidation production uses.
    const ctx = await browser.newContext();
    const f = await ctx.newPage();
    await login(f, founderEmail);
    await f.goto("/application/status");
    await f.getByRole("button", { name: "Hide my company" }).click();
    await expect(f.getByRole("button", { name: "Show my company" })).toBeVisible();
    await expectOnLanding(page, false);
    await f.getByRole("button", { name: "Show my company" }).click();
    await expect(f.getByRole("button", { name: "Hide my company" })).toBeVisible();
    await expectOnLanding(page, true);

    const res = await page.goto("/");
    // statically rendered and revalidated: served with a cache lifetime, never "private, no-store"
    expect(res?.headers()["cache-control"] ?? "").toMatch(/s-maxage|max-age/);
    expect(res?.headers()["cache-control"] ?? "").not.toMatch(/no-store/);
    const html = await page.content();
    expect(html).not.toMatch(/Irish Founders/i);

    const card = page.locator("li", { hasText: company });
    await expect(card.getByText("In review")).toBeVisible();
    await expect(card.getByText("Galway")).toBeVisible();
    // private details never reach the public page
    expect(html).not.toMatch(/linkedin\.com\/company\/corrib|Reg Founder/i);
    await ctx.close();
  });

  test("an admin can hide and re-show the company; the landing page follows", async ({ browser, page }) => {
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    await login(a, adminEmail);
    await a.goto(`/admin/applications/${appId}`);
    await a.getByRole("button", { name: "Hide from register" }).click();
    await expect(a.getByRole("button", { name: "Show on register" })).toBeVisible();
    await expectOnLanding(page, false);

    await a.getByRole("button", { name: "Show on register" }).click();
    await expect(a.getByRole("button", { name: "Hide from register" })).toBeVisible();
    await expectOnLanding(page, true);
    await ctx.close();
  });

  test("approval flips the company to 'Verified' on the landing page and the directory", async ({ browser, page }) => {
    const ctx = await browser.newContext();
    const a = await ctx.newPage();
    await login(a, adminEmail);
    await a.goto(`/admin/applications/${appId}`);
    for (const label of [/Company website is real/, /at least 50 genuine followers/, /genuine recent company posts/, /link to the company is evidenced/]) {
      await a.getByLabel(label).check();
    }
    await a.getByRole("button", { name: "Approve" }).click();
    await expect(a.getByText("Approved", { exact: true }).first()).toBeVisible();

    await expectOnLanding(page, true);
    const card = page.locator("li", { hasText: company });
    await expect(card.getByText("In review")).toHaveCount(0);
    await expect(card.getByRole("img", { name: "Verified startup" })).toBeVisible();
    await expect(card.getByRole("link")).toHaveAttribute("href", /\/startups\/corrib/);

    await page.goto("/startups");
    await expect(page.getByText(company).first()).toBeVisible();
    await ctx.close();
  });
});
