/**
 * Social layer in a real browser (run against a fresh local DB: `npm run db:reset` first
 * so matching is deterministic). Two verified founders are created through the admin API.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test, type Page } from "@playwright/test";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("E2E must run against local Supabase only.");

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";
const aliceEmail = `e2e-alice-${run}@example.test`;
const bobEmail = `e2e-bob-${run}@example.test`;
const aliceHandle = `alice_${run}`;

async function seedFounder(email: string, name: string, profile: Record<string, unknown>) {
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
  const id = data.user!.id;
  await admin.from("profiles").update({ role: "founder", verification_status: "approved", location: "Dublin", headline: "Founder", ...profile }).eq("id", id);
  const slug = `${name.toLowerCase().replace(/\W+/g, "-")}-${run}`;
  const { data: st } = await admin.from("startups").insert({
    name: `${name} Labs`, slug, website_url: `https://${slug}.example`, linkedin_url: `https://linkedin.com/company/${slug}`,
    normalized_domain: "", normalized_linkedin: "", industry: "FinTech", stage: "mvp", founded_year: 2024,
    short_description: "Payments for Irish SMEs", is_verified: true, created_by: id,
  }).select("id").single();
  await admin.from("startup_members").insert({ startup_id: st!.id, profile_id: id, is_admin: true });
  return { id, startupId: st!.id, slug };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/feed");
}

let alice: { id: string; startupId: string; slug: string };

test.describe.serial("social layer (browser)", () => {
  test.beforeAll(async () => {
    alice = await seedFounder(aliceEmail, `Alice${run}`, { open_to: ["cofounder"], offering: ["mentor"], skills: ["React"] });
    await seedFounder(bobEmail, `Bob${run}`, { open_to: ["mentor"], offering: ["cofounder"], skills: ["react"] });
  });

  test("identity, story, matching, profile, search and theme", async ({ browser }) => {
    const aliceCtx = await browser.newContext();
    const a = await aliceCtx.newPage();
    await login(a, aliceEmail);

    // --- set a handle and "open to" in settings
    await a.goto("/settings");
    await a.getByLabel("Handle").fill(aliceHandle);
    await a.getByRole("button", { name: "Save identity" }).click();
    await expect(a.getByText("Saved.").first()).toBeVisible();

    // --- post a story
    await a.goto("/stories/new");
    await a.getByLabel("What's happening?").fill("Closed our first pilot in Cork");
    await a.getByRole("button", { name: "Share story" }).click();
    await a.waitForURL("**/feed");
    await expect(a.getByRole("button", { name: "Your story" })).toBeVisible();

    // --- bob sees alice's ring, opens the viewer, then dismisses with Escape
    const bobCtx = await browser.newContext();
    const b = await bobCtx.newPage();
    await login(b, bobEmail);
    const ring = b.getByRole("button", { name: new RegExp(`Alice${run}.*new story`, "i") });
    await expect(ring).toBeVisible();
    await ring.click();
    const viewer = b.getByRole("dialog", { name: /Story by/ });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByText("Closed our first pilot in Cork")).toBeVisible();
    await b.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await b.reload();
    await expect(b.getByRole("button", { name: new RegExp(`Alice${run}.*story seen`, "i") })).toBeVisible(); // ring turns to "seen"

    // --- discover: alice is bob's best match, with reasons
    await b.goto("/discover");
    const card = b.getByRole("article", { name: `Match: Alice${run}` });
    await expect(card).toBeVisible();
    await expect(card.getByText(/cofounder/i).first()).toBeVisible();
    await expect(card.getByText("Both in FinTech")).toBeVisible();
    await card.getByRole("button", { name: "Connect" }).click();
    await expect(b.getByRole("article", { name: `Match: Alice${run}` })).toBeHidden(); // connected people leave the stack

    // --- public profile through the short handle
    await b.goto(`/u/${aliceHandle}`);
    await expect(b.getByRole("heading", { level: 1, name: `Alice${run}` })).toBeVisible();
    await expect(b.getByText("Looking for")).toBeVisible();
    await expect(b.getByRole("button", { name: /Follow|Following/ })).toBeVisible();
    await b.getByRole("button", { name: "Follow", exact: true }).click();
    await expect(b.getByRole("button", { name: "Following" })).toBeVisible();

    // --- command palette
    await b.goto("/feed");
    await b.waitForLoadState("networkidle"); // hydrated: the Ctrl+K listener is attached
    await b.keyboard.press("Control+k");
    const palette = b.getByRole("dialog", { name: "Search" });
    await expect(palette).toBeVisible();
    await palette.getByRole("combobox").fill(`Alice${run}`);
    await expect(palette.getByRole("option", { name: new RegExp(`^Alice${run} Founder`) })).toBeVisible();
    await expect(palette.getByRole("option", { name: new RegExp(`^Alice${run} Labs`) })).toBeVisible();
    await b.keyboard.press("Enter");
    await expect(b).toHaveURL(new RegExp(`/founders/${alice.id}`));

    // --- dark mode toggle persists
    await b.getByRole("button", { name: /Switch to dark theme/ }).first().click();
    await expect(b.locator("html")).toHaveAttribute("data-theme", "dark");
    await b.reload();
    await expect(b.locator("html")).toHaveAttribute("data-theme", "dark");

    await aliceCtx.close();
    await bobCtx.close();
  });

  test("launch day crowns a launch of the day", async ({ page }) => {
    await admin.from("product_launches").insert({
      startup_id: alice.startupId, founder_id: alice.id, name: `Widget${run}`, slug: `widget-${run}`, tagline: "A widget that works",
      description: "Does widget things", website_url: `https://widget-${run}.example`, category: "Tools", stage: "mvp",
    });
    await page.goto("/launches");
    await expect(page.getByRole("article", { name: "Launch of the day" })).toContainText(`Widget${run}`);
    await page.goto("/launches?range=all");
    await expect(page.getByText(`Widget${run}`).first()).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("bottom tab bar and create sheet", async ({ page }) => {
    await login(page, bobEmail);
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(page.getByRole("complementary")).toBeHidden(); // desktop sidebar is not shown
    await nav.getByRole("button", { name: "Create" }).click();
    const sheet = page.getByRole("dialog", { name: "Create" });
    await expect(sheet.getByRole("link", { name: /Add a story/ })).toBeVisible();
    await sheet.getByRole("link", { name: /Add a story/ }).click();
    await expect(page).toHaveURL(/\/stories\/new/);
    // no horizontal scroll on mobile
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
