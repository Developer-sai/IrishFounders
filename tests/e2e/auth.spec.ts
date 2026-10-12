/** Route guards and session edge cases (production build, local Supabase). */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("E2E must run against local Supabase only.");

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";

async function user(label: string, profile: Record<string, unknown> = {}) {
  const email = `${label}-${run}@example.test`;
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `${label} Tester` } });
  if (Object.keys(profile).length) await admin.from("profiles").update(profile).eq("id", data.user!.id);
  return { id: data.user!.id, email };
}

test.describe("route guards", () => {
  test("anonymous visitors are sent to login and returned afterwards", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login\?next=%2Ffeed/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("an unapproved applicant is held on the status page", async ({ page }) => {
    const u = await user("pending");
    await page.goto("/login");
    await page.getByLabel("Email").fill(u.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/application\/status/);
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/application\/status/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/application\/status/);
  });

  test("a revoked session never causes a redirect loop", async ({ page }) => {
    const u = await user("revoked", { role: "founder", verification_status: "approved" });
    await page.goto("/login");
    await page.getByLabel("Email").fill(u.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/feed/);

    // The account disappears while the browser still holds a structurally valid, unexpired token.
    await admin.auth.admin.deleteUser(u.id);

    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/); // stays on the form: no bounce back to /feed
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("members cannot open the admin area", async ({ page }) => {
    const u = await user("member", { role: "founder", verification_status: "approved" });
    await page.goto("/login");
    await page.getByLabel("Email").fill(u.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/feed/);
    await page.goto("/admin");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });

  test("public pages do not scroll sideways on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/login", "/signup", "/about"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
