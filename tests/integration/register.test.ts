/**
 * The public register (verified + "in review" companies): what anonymous visitors can see,
 * opt-out, admin hiding, and the privacy boundary. Runs against LOCAL Supabase only.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/lib/supabase/database.types";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("Integration tests must run against local Supabase only.");

type Client = SupabaseClient<Database>;
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";
const admin: Client = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });
const anon: Client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });

async function makeUser(label: string): Promise<{ id: string; client: Client }> {
  const email = `${label}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `${label} Tester` },
  });
  if (error || !data.user) throw error;
  const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (e2) throw e2;
  return { id: data.user.id, client };
}

const app = (name: string, domain: string, extra: Record<string, unknown> = {}) => ({
  applicant_type: "founder",
  profile: { full_name: `${name} Founder`, linkedin_url: "https://linkedin.com/in/x", location: "Cork", headline: "CEO" },
  company_name: name, company_website: `https://${domain}`, company_linkedin: `https://linkedin.com/company/${domain.split(".")[0]}`,
  company_city: "Cork", industry: "FinTech", stage: "idea", founded_year: 2025, team_size: 2, company_description: "A secret internal description.",
  linkedin_follower_count: 120, sample_post_urls: ["https://linkedin.com/posts/1", "https://linkedin.com/posts/2"],
  relationship_to_company: "Founder", founder_role: "CEO", interview: { problem: "a", why: "b", built: "c", challenge: "d", gain: "e", contribute: "f" },
  ...extra,
});

const nameA = `Alpha${run}`;
const nameB = `Bravo${run}`;
let superAdmin: { id: string; client: Client };
let a: { id: string; client: Client };
let b: { id: string; client: Client };
let appA = "";
const reg = async () => (await anon.rpc("public_register", { p_limit: 300 })).data ?? [];
const find = async (name: string) => (await reg()).find((r) => r.name === name);

describe("public register", () => {
  beforeAll(async () => {
    superAdmin = await makeUser("regadmin");
    await admin.from("profiles").update({ role: "super_admin", verification_status: "approved" }).eq("id", superAdmin.id);
    a = await makeUser("rega");
    b = await makeUser("regb");
  }, 60_000);

  it("a submitted application appears for anonymous visitors as 'pending', with only whitelisted columns", async () => {
    const { data, error } = await a.client.rpc("submit_application", { p: app(nameA, `${nameA.toLowerCase()}.ie`) });
    expect(error).toBeNull();
    appA = data as string;

    const row = await find(nameA);
    expect(row).toBeTruthy();
    expect(row).toMatchObject({ kind: "pending", name: nameA, industry: "FinTech", city: "Cork", slug: null });
    // privacy boundary: nothing beyond the whitelist is exposed
    expect(Object.keys(row!).sort()).toEqual(["city", "industry", "kind", "logo_url", "name", "slug", "sort_at", "stage"]);
    expect(JSON.stringify(row)).not.toMatch(/secret internal|linkedin|\.ie|Founder|Tester/i);
    // and the underlying tables stay private
    expect((await anon.from("membership_applications").select("id")).data ?? []).toHaveLength(0);
    expect((await anon.from("membership_applications").select("id")).error).not.toBeNull();
  });

  it("applicants can opt out and back in; other people cannot change it", async () => {
    expect((await a.client.rpc("set_my_company_visibility", { p_visible: false })).error).toBeNull();
    expect(await find(nameA)).toBeUndefined();
    expect((await a.client.rpc("set_my_company_visibility", { p_visible: true })).error).toBeNull();
    expect(await find(nameA)).toBeTruthy();

    // b has no application: calling it changes nothing for a
    await b.client.rpc("set_my_company_visibility", { p_visible: false });
    expect(await find(nameA)).toBeTruthy();
    // anonymous callers are refused
    expect((await anon.rpc("set_my_company_visibility", { p_visible: false })).error).not.toBeNull();
  });

  it("only a super admin can hide a name, and hidden names stay hidden even if the applicant opts in", async () => {
    expect((await a.client.rpc("set_application_visibility", { p_app: appA, p_hidden: true })).error?.code).toBe("42501");
    expect((await superAdmin.client.rpc("set_application_visibility", { p_app: appA, p_hidden: true })).error).toBeNull();
    expect(await find(nameA)).toBeUndefined();
    await a.client.rpc("set_my_company_visibility", { p_visible: true });
    expect(await find(nameA)).toBeUndefined();
    const { data: log } = await superAdmin.client.from("admin_audit_logs").select("action").eq("target_id", appA);
    expect(log?.map((l) => l.action)).toContain("register_hidden");
    expect((await superAdmin.client.rpc("set_application_visibility", { p_app: appA, p_hidden: false })).error).toBeNull();
    expect(await find(nameA)).toBeTruthy();
  });

  it("company names are validated at the database", async () => {
    const tooLong = "X".repeat(81);
    const r1 = await b.client.rpc("submit_application", { p: app(tooLong, `long${run}.ie`) });
    expect(r1.error).not.toBeNull();
    const r2 = await b.client.rpc("submit_application", { p: app("A", `short${run}.ie`) });
    expect(r2.error).not.toBeNull();
    expect(await find(tooLong)).toBeUndefined();
  });

  it("approval flips the company to 'verified' (no duplicate), rejection removes it", async () => {
    await superAdmin.client.rpc("review_application", { p_app: appA, p_decision: "save", p_checks: { website: true, followers: true, posts: true, relationship: true } });
    expect((await superAdmin.client.rpc("review_application", { p_app: appA, p_decision: "approve" })).error).toBeNull();
    const rows = (await reg()).filter((r) => r.name === nameA);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "verified" });
    expect(rows[0]!.slug).toBeTruthy();

    const { data: appB } = await b.client.rpc("submit_application", { p: app(nameB, `${nameB.toLowerCase()}.ie`) });
    expect(await find(nameB)).toMatchObject({ kind: "pending" });
    expect((await superAdmin.client.rpc("review_application", { p_app: appB as string, p_decision: "reject", p_reason: "Not eligible" })).error).toBeNull();
    expect(await find(nameB)).toBeUndefined();
  });

  it("demo records never appear, and counts match the register", async () => {
    const { data: demo } = await admin.auth.admin.createUser({ email: `demo-${run}@example.test`, password: PASSWORD, email_confirm: true });
    await admin.from("profiles").update({ is_demo: true, verification_status: "submitted" }).eq("id", demo.user!.id);
    await admin.from("membership_applications").insert({
      profile_id: demo.user!.id, applicant_type: "founder", company_name: `Demo${run}`, normalized_domain: `demo${run}.example`, company_city: "Dublin",
    });
    expect(await find(`Demo${run}`)).toBeUndefined();

    const rows = await reg();
    const { data: counts } = await anon.rpc("public_register_counts");
    const c = counts as { verified: number; pending: number };
    expect(c.verified).toBe(rows.filter((r) => r.kind === "verified").length);
    expect(c.pending).toBe(rows.filter((r) => r.kind === "pending").length);
  });
});
