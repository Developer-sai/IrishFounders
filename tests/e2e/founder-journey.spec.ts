import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test, type Page } from "@playwright/test";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("E2E must run against local Supabase only.");

const MAILPIT = "http://127.0.0.1:54324";
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";
const founderEmail = `e2e-founder-${run}@example.test`;
const adminEmail = `e2e-admin-${run}@example.test`;
const company = `Shamrock${run}`;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function confirmationLink(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0]!.ID}`)).json()) as { HTML: string; Text: string };
      const match = (msg.HTML + msg.Text).match(/https?:\/\/[^"'\s<>)]*\/auth\/v1\/verify[^"'\s<>)]*/);
      if (match) return match[0].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No confirmation email received");
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.serial("founder journey (browser)", () => {
  test("sign up, confirm email, apply, get approved, reach the dashboard", async ({ page, browser }) => {
    // --- sign up
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Siobhan Kelly");
    await page.getByLabel("Email").fill(founderEmail);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Check your inbox")).toBeVisible();

    // --- confirm via the real emailed link
    await page.goto(await confirmationLink(founderEmail));
    await expect(page).toHaveURL(/\/application\/status/);
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();

    // pending applicants cannot reach the community
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/application\/status/);

    // --- founder wizard
    await page.goto("/onboarding/founder");
    await page.getByLabel("Your LinkedIn profile URL").fill("linkedin.com/in/siobhan");
    await page.getByLabel("Location").fill("Dublin, Ireland");
    await page.getByLabel("Your role at the company").fill("Co-founder & CEO");
    await page.getByRole("button", { name: "Continue" }).click();

    // validation blocks progress
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Company name is required")).toBeVisible();

    await page.getByLabel("Company name").fill(company);
    await page.getByLabel("Company website").fill(`${company.toLowerCase()}.ie`);
    await page.getByLabel("Company LinkedIn page").fill(`linkedin.com/company/${company.toLowerCase()}`);
    await page.getByLabel("Industry").fill("FinTech");
    await page.getByLabel("Short description").fill("Payments infrastructure for Irish SMEs.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Company LinkedIn follower count").fill("85");
    await page.getByLabel(/Links to company LinkedIn posts/).fill("https://linkedin.com/posts/a\nhttps://linkedin.com/posts/b");
    await page.getByLabel("Your relationship to the company").fill("Co-founder and CEO since 2024.");
    await page.getByRole("button", { name: "Continue" }).click();

    for (const q of ["What problem are you solving?", "Why did you start this company?", "What have you built so far?",
      "What is your current biggest challenge?", "What are you hoping to gain from Irish Founders?", "How can you contribute to other founders?"]) {
      await page.getByLabel(q).fill("A thoughtful answer.");
    }
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Submit application" }).click();

    await expect(page).toHaveURL(/\/application\/status/);
    await expect(page.getByText("Submitted", { exact: true }).first()).toBeVisible();

    // --- admin approves in a separate browser context
    const { data: adminUser } = await admin.auth.admin.createUser({ email: adminEmail, password: PASSWORD, email_confirm: true, user_metadata: { full_name: "Admin Tester" } });
    await admin.from("profiles").update({ role: "super_admin", verification_status: "approved" }).eq("id", adminUser!.user!.id);

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, adminEmail);
    await expect(adminPage).toHaveURL(/\/admin/);
    await adminPage.goto("/admin/applications");
    await adminPage.getByRole("link", { name: new RegExp(company) }).first().click();
    await expect(adminPage.getByText("Interview answers")).toBeVisible();

    // approving before the checklist is complete is refused
    await adminPage.getByRole("button", { name: "Approve" }).click();
    await expect(adminPage.getByRole("alert").filter({ hasText: "checklist" })).toBeVisible();

    for (const label of [/Company website is real/, /at least 50 genuine followers/, /genuine recent company posts/, /link to the company is evidenced/]) {
      await adminPage.getByLabel(label).check();
    }
    await adminPage.getByRole("button", { name: "Approve" }).click();
    await expect(adminPage.getByText("Approved", { exact: true }).first()).toBeVisible();
    await adminCtx.close();

    // --- founder now has the workspace
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome, Siobhan/ })).toBeVisible();
    await expect(page.getByText(company).first()).toBeVisible();

    // post to the feed through the real form
    await page.goto("/feed");
    await page.getByLabel("What are you building today?").fill("Shipped our first release!");
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.getByText("Shipped our first release!")).toBeVisible();

    // the verified company is public
    await page.goto("/startups");
    await expect(page.getByText(company)).toBeVisible();

    // non-admins are denied the admin area
    await page.goto("/admin");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
