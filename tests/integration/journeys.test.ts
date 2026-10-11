/**
 * Acceptance journeys against a LOCAL Supabase stack (npm run db:start).
 * Exercises the real RLS policies and RPCs as separate authenticated users.
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

async function makeUser(label: string): Promise<{ id: string; client: Client }> {
  const email = `${label}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `${label} Tester` },
  });
  if (error || !data.user) throw error;
  const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

const founderApp = (name: string, domain: string) => ({
  applicant_type: "founder",
  profile: { full_name: `${name} Founder`, linkedin_url: "https://linkedin.com/in/x", location: "Dublin", headline: "CEO" },
  company_name: name, company_website: `https://www.${domain}/`, company_linkedin: `https://ie.linkedin.com/company/${name.toLowerCase()}`,
  industry: "SaaS", stage: "mvp", founded_year: 2024, team_size: 3, company_description: "We build things.",
  linkedin_follower_count: 120, sample_post_urls: ["https://linkedin.com/posts/1", "https://linkedin.com/posts/2"],
  relationship_to_company: "Founder", founder_role: "CEO",
  interview: { problem: "a", why: "b", built: "c", challenge: "d", gain: "e", contribute: "f" },
});

let superAdmin: { id: string; client: Client };
let alice: { id: string; client: Client };
let bob: { id: string; client: Client };
let investor: { id: string; client: Client };
let outsider: { id: string; client: Client };
const companyA = `acme${run}`;

describe("acceptance journeys", () => {
  beforeAll(async () => {
    superAdmin = await makeUser("admin");
    alice = await makeUser("alice");
    bob = await makeUser("bob");
    investor = await makeUser("investor");
    outsider = await makeUser("outsider");
    // The first admin is promoted out-of-band (service role), never via the app.
    await admin.from("profiles").update({ role: "super_admin", verification_status: "approved" }).eq("id", superAdmin.id);
    await superAdmin.client.auth.refreshSession();
  }, 60_000);

  it("1. founder submits an application; 2. stays restricted while pending", async () => {
    const { data: appId, error } = await alice.client.rpc("submit_application", { p: founderApp(companyA, `${companyA}.ie`) });
    expect(error).toBeNull();
    expect(appId).toBeTruthy();

    const { data: me } = await alice.client.from("profiles").select("role, verification_status").eq("id", alice.id).single();
    expect(me).toEqual({ role: "public_visitor", verification_status: "submitted" });

    // Private community content is invisible and unwritable while pending.
    const posts = await alice.client.from("posts").select("id");
    expect(posts.data ?? []).toHaveLength(0);
    const write = await alice.client.from("posts").insert({ author_id: alice.id, category: "ask_community", content: "hi" });
    expect(write.error).not.toBeNull();
  });

  it("rejects founder applications below the follower / post thresholds", async () => {
    const low = await bob.client.rpc("submit_application", { p: { ...founderApp("Lowco", "lowco.ie"), linkedin_follower_count: 10 } });
    expect(low.error?.message).toContain("insufficient_followers");
    const fewPosts = await bob.client.rpc("submit_application", { p: { ...founderApp("Lowco", "lowco.ie"), sample_post_urls: ["https://x.y/1"] } });
    expect(fewPosts.error?.message).toContain("insufficient_posts");
    const badLi = await bob.client.rpc("submit_application", { p: { ...founderApp("Lowco", "lowco.ie"), company_linkedin: "https://linkedin.com/in/someone" } });
    expect(badLi.error?.message).toContain("invalid_company_linkedin");
  });

  it("13. unauthorised users cannot touch admin functions or private records", async () => {
    const { data: apps } = await alice.client.from("membership_applications").select("id");
    expect(apps).toHaveLength(1); // only her own
    const { data: bobsView } = await outsider.client.from("membership_applications").select("id");
    expect(bobsView).toHaveLength(0);

    const review = await alice.client.rpc("review_application", { p_app: apps![0]!.id, p_decision: "approve" });
    expect(review.error?.code).toBe("42501");
    expect((await alice.client.rpc("admin_overview")).error?.code).toBe("42501");
    expect((await alice.client.from("admin_audit_logs").select("id")).data ?? []).toHaveLength(0);

    const elevate = await alice.client.from("profiles").update({ role: "super_admin" }).eq("id", alice.id);
    expect(elevate.error).not.toBeNull();
    const selfApprove = await alice.client.from("profiles").update({ verification_status: "approved" }).eq("id", alice.id);
    expect(selfApprove.error).not.toBeNull();
    const email = await alice.client.from("profiles").select("email");
    expect(email.error).not.toBeNull(); // column not granted
  });

  it("3-4. admin reviews, is blocked until the checklist is complete, then approves", async () => {
    const { data: apps } = await superAdmin.client.from("membership_applications").select("id, profile_id").eq("profile_id", alice.id);
    const appId = apps![0]!.id;

    const early = await superAdmin.client.rpc("review_application", { p_app: appId, p_decision: "approve" });
    expect(early.error?.message).toContain("checklist_incomplete");

    const noReason = await superAdmin.client.rpc("review_application", { p_app: appId, p_decision: "reject" });
    expect(noReason.error?.message).toContain("reason_required");

    await superAdmin.client.rpc("review_application", {
      p_app: appId, p_decision: "save", p_notes: "Checked site and LinkedIn",
      p_checks: { website: true, followers: true, posts: true, relationship: true },
    });
    const ok = await superAdmin.client.rpc("review_application", { p_app: appId, p_decision: "approve" });
    expect(ok.error).toBeNull();

    const { data: me } = await alice.client.from("profiles").select("role, verification_status").eq("id", alice.id).single();
    expect(me).toEqual({ role: "founder", verification_status: "approved" });

    const { data: logs } = await superAdmin.client.from("admin_audit_logs").select("action").eq("target_id", appId);
    expect(logs?.map((l) => l.action)).toContain("application_approve");
    const { data: notes } = await alice.client.from("notifications").select("type").eq("user_id", alice.id);
    expect(notes?.map((n) => n.type)).toContain("application_decision");
  });

  it("5. approved founder has a verified startup with normalised identifiers; public can read it", async () => {
    const { data: members } = await alice.client.from("startup_members").select("startup_id, is_admin").eq("profile_id", alice.id);
    expect(members).toHaveLength(1);
    const { data: startup } = await alice.client.from("startups").select("*").eq("id", members![0]!.startup_id).single();
    expect(startup).toMatchObject({ is_verified: true, normalized_domain: `${companyA}.ie`, normalized_linkedin: `linkedin.com/company/${companyA}` });

    const anon = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    const pub = await anon.from("startups").select("name").eq("slug", startup!.slug);
    expect(pub.data).toHaveLength(1);
    const stats = await anon.rpc("public_stats");
    expect((stats.data as { verified_startups: number }).verified_startups).toBeGreaterThanOrEqual(1);
    // anonymous visitors cannot read profiles directly or any private tables
    expect((await anon.from("profiles").select("id")).error).not.toBeNull();
    expect((await anon.from("public_founders").select("id").eq("id", alice.id)).data).toHaveLength(1);
  });

  it("11. a duplicate company is detected and routed to a claim", async () => {
    // pre-check surfaces the existing startup
    const check = await bob.client.rpc("check_company", { p_website: `https://${companyA}.ie/about?x=1`, p_linkedin: null as unknown as string });
    expect((check.data as { startup: { name: string } | null }).startup?.name).toBe(companyA);

    // direct creation by an approved founder is refused with the canonical slug
    const dup = await alice.client.rpc("create_startup", {
      p: { name: "Clone", website_url: `http://${companyA}.ie`, linkedin_url: "linkedin.com/company/clone", industry: "x", stage: "idea", founded_year: 2024, team_size: 1, short_description: "dup" },
    });
    expect(dup.error?.message).toContain("duplicate_company:");

    // a second applicant with the same domain can apply; approval creates a claim, not a second company
    const { data: appId } = await bob.client.rpc("submit_application", { p: { ...founderApp("Acme Two", `${companyA}.ie`), company_linkedin: "linkedin.com/company/acmetwo" + run } });
    await superAdmin.client.rpc("review_application", {
      p_app: appId as string, p_decision: "save", p_checks: { website: true, followers: true, posts: true, relationship: true },
    });
    expect((await superAdmin.client.rpc("review_application", { p_app: appId as string, p_decision: "approve" })).error).toBeNull();
    const { count } = await admin.from("startups").select("id", { count: "exact", head: true }).eq("normalized_domain", `${companyA}.ie`);
    expect(count).toBe(1);
    const { data: claims } = await superAdmin.client.from("startup_claims").select("id, claimant_id").eq("claimant_id", bob.id);
    expect(claims).toHaveLength(1);
    expect((await superAdmin.client.rpc("resolve_claim", { p_claim: claims![0]!.id, p_approve: true })).error).toBeNull();
    const { data: team } = await admin.from("startup_members").select("profile_id").eq("profile_id", bob.id);
    expect(team).toHaveLength(1);
  });

  it("6. approved founder publishes an update and a launch; duplicate launches are refused", async () => {
    const post = await alice.client.from("posts").insert({ author_id: alice.id, category: "startup_milestone", content: "We shipped v1" }).select("id").single();
    expect(post.error).toBeNull();
    const { data: m } = await alice.client.from("startup_members").select("startup_id").eq("profile_id", alice.id).single();
    const launch = await alice.client.from("product_launches").insert({
      startup_id: m!.startup_id, founder_id: alice.id, name: "Widget", slug: "widget", tagline: "A widget", description: "Does widget things",
      website_url: "https://widget.example", category: "Tools", stage: "mvp",
    });
    expect(launch.error).toBeNull();
    const again = await alice.client.from("product_launches").insert({
      startup_id: m!.startup_id, founder_id: alice.id, name: "Widget", slug: "widget", tagline: "A widget", description: "Does widget things",
      website_url: "https://widget.example", category: "Tools", stage: "mvp",
    });
    expect(again.error).not.toBeNull();

    // clients cannot inflate counters or feature their own launch
    const cheat = await alice.client.from("product_launches").insert({
      startup_id: m!.startup_id, founder_id: alice.id, name: "Cheat", slug: "cheat", tagline: "t", description: "d", website_url: "https://c.example",
      category: "Tools", stage: "mvp", votes_count: 999, is_featured: true,
    } as never);
    expect(cheat.error).not.toBeNull();
  });

  it("7-8. connection request, acceptance, then realtime-capable messaging only after acceptance", async () => {
    const req = await bob.client.rpc("request_connection", { p_recipient: alice.id });
    expect(req.error).toBeNull();
    expect((await bob.client.rpc("request_connection", { p_recipient: alice.id })).error?.message).toContain("connection_exists");

    // no conversation exists yet, so messaging is impossible
    expect((await bob.client.from("conversations").select("id")).data).toHaveLength(0);

    expect((await alice.client.rpc("respond_connection", { p_id: req.data as string, p_accept: true })).error).toBeNull();
    const { data: convs } = await bob.client.from("conversations").select("id").limit(1);
    expect(convs).toHaveLength(1);

    const msg = await bob.client.from("messages").insert({ conversation_id: convs![0]!.id, sender_id: bob.id, content: "Hello Alice" });
    expect(msg.error).toBeNull();
    const seen = await alice.client.from("messages").select("content").eq("conversation_id", convs![0]!.id);
    expect(seen.data?.map((r) => r.content)).toEqual(["Hello Alice"]);
    // impersonation and outsiders are blocked
    expect((await bob.client.from("messages").insert({ conversation_id: convs![0]!.id, sender_id: alice.id, content: "spoof" })).error).not.toBeNull();
    expect((await outsider.client.from("messages").select("id").eq("conversation_id", convs![0]!.id)).data).toHaveLength(0);

    // blocking ends the ability to message
    expect((await alice.client.rpc("block_user", { p_user: bob.id })).error).toBeNull();
    expect((await bob.client.from("messages").insert({ conversation_id: convs![0]!.id, sender_id: bob.id, content: "still there?" })).error).not.toBeNull();
  });

  it("9-10. investor is verified separately, then requests an introduction the founder must accept", async () => {
    const { data: appId, error } = await investor.client.rpc("submit_application", {
      p: {
        applicant_type: "investor", profile: { full_name: "Ivy Investor", linkedin_url: "linkedin.com/in/ivy", location: "Cork", headline: "Angel" },
        organisation_name: "Ivy Capital", organisation_website: "https://ivy.example",
        investor: { investor_category: "angel", professional_background: "Ex-operator", investment_sectors: ["SaaS"], preferred_stages: ["mvp"], geographic_preferences: ["Ireland"], public_portfolio_links: [], disclaimer_accepted: true },
        interview: { background: "a", interests: "b", value: "c", why: "d" },
      },
    });
    expect(error).toBeNull();
    // before approval: cannot request introductions
    const { data: m } = await alice.client.from("startup_members").select("startup_id").eq("profile_id", alice.id).single();
    expect((await investor.client.rpc("request_introduction", { p_founder: alice.id, p_startup: m!.startup_id, p_message: "Hello there founder" })).error?.code).toBe("42501");

    expect((await superAdmin.client.rpc("review_application", { p_app: appId as string, p_decision: "approve" })).error).toBeNull();
    const intro = await investor.client.rpc("request_introduction", { p_founder: alice.id, p_startup: m!.startup_id, p_message: "Hello there founder" });
    expect(intro.error).toBeNull();
    // no private channel until accepted
    expect((await investor.client.from("conversations").select("id")).data).toHaveLength(0);
    expect((await alice.client.rpc("respond_introduction", { p_id: intro.data as string, p_accept: true })).error).toBeNull();
    expect((await investor.client.from("conversations").select("id")).data).toHaveLength(1);

    // founders cannot call investor-only RPCs
    expect((await alice.client.rpc("request_introduction", { p_founder: alice.id, p_startup: m!.startup_id, p_message: "Hello there founder" })).error?.code).toBe("42501");
  });

  it("12. a reported post enters the moderation queue and removal notifies the author", async () => {
    const { data: post } = await alice.client.from("posts").select("id").eq("author_id", alice.id).limit(1).single();
    const report = await investor.client.from("reports").insert({ reporter_id: investor.id, target_type: "post", target_id: post!.id, reason: "Looks like spam" });
    expect(report.error).toBeNull();
    expect((await alice.client.from("reports").select("id")).data).toHaveLength(0); // author cannot see reports

    const { data: open } = await superAdmin.client.from("reports").select("id").eq("status", "open").eq("target_id", post!.id);
    expect(open!.length).toBeGreaterThanOrEqual(1);
    expect((await superAdmin.client.rpc("moderate_report", { p_report: open![0]!.id, p_action: "remove_content", p_note: "Spam" })).error).toBeNull();
    const after = await investor.client.from("posts").select("id").eq("id", post!.id);
    expect(after.data).toHaveLength(0);
    const note = await alice.client.from("notifications").select("type").eq("type", "moderation");
    expect(note.data).toHaveLength(1);
  });

  it("14. admin statistics reflect real database counts", async () => {
    const { data } = await superAdmin.client.rpc("admin_overview");
    const o = data as Record<string, number>;
    const { count: founders } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "founder").eq("verification_status", "approved");
    expect(o.approved_founders).toBe(founders);
    expect(o.open_reports).toBe(0);
    expect(o.approved_investors).toBeGreaterThanOrEqual(1);
  });

  it("suspended members lose access immediately", async () => {
    expect((await superAdmin.client.rpc("admin_set_user_status", { p_user: bob.id, p_action: "suspend" })).error?.message).toContain("reason_required");
    expect((await superAdmin.client.rpc("admin_set_user_status", { p_user: bob.id, p_action: "suspend", p_reason: "Abuse" })).error).toBeNull();
    const post = await bob.client.from("posts").insert({ author_id: bob.id, category: "ask_community", content: "hello" });
    expect(post.error).not.toBeNull();
    // restoring brings back the approved status
    expect((await superAdmin.client.rpc("admin_set_user_status", { p_user: bob.id, p_action: "restore" })).error).toBeNull();
    const restored = await bob.client.from("posts").insert({ author_id: bob.id, category: "ask_community", content: "back again" });
    expect(restored.error).toBeNull();
    expect((await superAdmin.client.rpc("admin_set_user_status", { p_user: superAdmin.id, p_action: "suspend", p_reason: "x" })).error?.message).toContain("cannot_modify_admin");
  });
});
