/**
 * v2 social layer against a LOCAL Supabase stack: handles, follows, stories, mentions,
 * matching, launch ranking, search, milestones. Each assertion runs as a real signed-in user.
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
type User = { id: string; client: Client; startupId: string; handle: string };
const run = Date.now().toString(36);
const PASSWORD = "correct-horse-battery-staple";
const admin: Client = createClient<Database>(URL, SERVICE, { auth: { persistSession: false } });

async function makeFounder(
  label: string,
  profile: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {},
  industry = "FinTech",
): Promise<User> {
  const email = `${label}-${run}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `${label} Founder` },
  });
  if (error || !data.user) throw error;
  const id = data.user.id;
  const handle = `${label}_${run}`.slice(0, 30);
  await admin.from("profiles").update({
    role: "founder", verification_status: "approved", location: "Dublin", ...profile,
  }).eq("id", id);
  const { data: st } = await admin.from("startups").insert({
    name: `${label} Co ${run}`, slug: `${label}-co-${run}`, website_url: `https://${label}-${run}.example`,
    linkedin_url: `https://linkedin.com/company/${label}-${run}`, normalized_domain: "", normalized_linkedin: "",
    industry, stage: "mvp", founded_year: 2024, short_description: "x", is_verified: true, created_by: id,
  }).select("id").single();
  await admin.from("startup_members").insert({ startup_id: st!.id, profile_id: id, is_admin: true });
  const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (e2) throw e2;
  return { id, client, startupId: st!.id, handle };
}

let alice: User, bob: User, carol: User, dave: User;
let outsider: { id: string; client: Client };

describe("social layer", () => {
  beforeAll(async () => {
    alice = await makeFounder("alice", { open_to: ["cofounder"], offering: ["mentor"], skills: ["React", "Design"] });
    bob = await makeFounder("bob", { open_to: ["mentor"], offering: ["cofounder"], skills: ["react", "Sales"] });
    carol = await makeFounder("carol", { offering: ["feedback"] }, "HealthTech");
    dave = await makeFounder("dave", {}, "FinTech");
    const email = `outsider-${run}@example.test`;
    const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    const client = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    await client.auth.signInWithPassword({ email, password: PASSWORD });
    outsider = { id: data.user!.id, client };
  }, 90_000);

  it("handles: valid, unique case-insensitively, and format/reserved names are refused", async () => {
    expect((await alice.client.from("profiles").update({ handle: alice.handle }).eq("id", alice.id)).error).toBeNull();
    expect((await bob.client.from("profiles").update({ handle: alice.handle.toUpperCase() }).eq("id", bob.id)).error?.code).toBe("23505");
    expect((await bob.client.from("profiles").update({ handle: "ab" }).eq("id", bob.id)).error).not.toBeNull();
    expect((await bob.client.from("profiles").update({ handle: "admin" }).eq("id", bob.id)).error).not.toBeNull();
    expect((await bob.client.from("profiles").update({ handle: "has space" }).eq("id", bob.id)).error).not.toBeNull();
    await bob.client.from("profiles").update({ handle: bob.handle }).eq("id", bob.id);
    await carol.client.from("profiles").update({ handle: carol.handle }).eq("id", carol.id);
    // looking-for / offering vocabularies are enforced
    expect((await alice.client.from("profiles").update({ open_to: ["bogus"] }).eq("id", alice.id)).error).not.toBeNull();
    // role cannot be changed through the new column grants
    expect((await alice.client.from("profiles").update({ role: "super_admin" }).eq("id", alice.id)).error).not.toBeNull();
  });

  it("follows: members follow, outsiders cannot, blocked users cannot, unfollow works", async () => {
    expect((await alice.client.rpc("follow_user", { p_user: bob.id })).error).toBeNull();
    expect((await alice.client.rpc("follow_user", { p_user: bob.id })).error).toBeNull(); // idempotent
    const { data: n } = await bob.client.from("notifications").select("type").eq("type", "follow");
    expect(n).toHaveLength(1); // exactly one, not duplicated
    expect((await alice.client.rpc("follow_user", { p_user: alice.id })).error?.code).toBe("42501");
    expect((await outsider.client.rpc("follow_user", { p_user: bob.id })).error?.code).toBe("42501");
    expect((await outsider.client.from("follows").select("*")).data ?? []).toHaveLength(0);

    await dave.client.rpc("block_user", { p_user: alice.id });
    expect((await alice.client.rpc("follow_user", { p_user: dave.id })).error?.message).toContain("blocked");

    expect((await alice.client.from("follows").delete().eq("follower_id", alice.id).eq("followed_id", bob.id)).error).toBeNull();
    expect((await alice.client.from("follows").select("*").eq("follower_id", alice.id)).data).toHaveLength(0);
    // you cannot remove someone else's follow
    await bob.client.rpc("follow_user", { p_user: alice.id });
    await alice.client.from("follows").delete().eq("follower_id", bob.id);
    expect((await bob.client.from("follows").select("*").eq("follower_id", bob.id)).data).toHaveLength(1);
  });

  it("stories: media must live in your own folder, outsiders cannot read, expiry and blocks hide them, limit of 10/day", async () => {
    const own = `${URL}/storage/v1/object/public/story-media/${alice.id}/a.png`;
    const foreign = `${URL}/storage/v1/object/public/story-media/${bob.id}/a.png`;
    expect((await alice.client.rpc("create_story", { p_text: "Shipping today", p_media_url: own, p_kind: "update", p_startup: alice.startupId })).error).toBeNull();
    expect((await alice.client.rpc("create_story", { p_text: "x", p_media_url: foreign, p_kind: "update", p_startup: null as unknown as string })).error?.message).toContain("invalid_media");
    expect((await alice.client.rpc("create_story", { p_text: "x", p_media_url: null as unknown as string, p_kind: "update", p_startup: bob.startupId })).error?.code).toBe("42501");
    expect((await alice.client.rpc("create_story", { p_text: "", p_media_url: null as unknown as string, p_kind: "update", p_startup: null as unknown as string })).error).not.toBeNull();
    expect((await alice.client.rpc("create_story", { p_text: "x".repeat(300), p_media_url: null as unknown as string, p_kind: "update", p_startup: null as unknown as string })).error).not.toBeNull();

    // direct inserts are not allowed (no insert grant): only the RPC creates stories
    expect((await alice.client.from("stories").insert({ author_id: alice.id, text: "sneaky" } as never)).error).not.toBeNull();

    expect((await outsider.client.from("stories").select("id")).data ?? []).toHaveLength(0);
    expect((await bob.client.from("stories").select("id").eq("author_id", alice.id)).data).toHaveLength(1);

    // tray + views
    const { data: tray } = await bob.client.rpc("story_tray");
    expect(tray?.find((t) => t.author_id === alice.id)).toMatchObject({ story_count: 1, unseen_count: 1 });
    const { data: stories } = await bob.client.from("stories").select("id").eq("author_id", alice.id);
    expect((await bob.client.from("story_views").insert({ story_id: stories![0]!.id, viewer_id: bob.id })).error).toBeNull();
    expect((await bob.client.from("story_views").insert({ story_id: stories![0]!.id, viewer_id: alice.id })).error).not.toBeNull(); // no spoofed views
    const { data: tray2 } = await bob.client.rpc("story_tray");
    expect(tray2?.find((t) => t.author_id === alice.id)?.unseen_count).toBe(0);
    expect((await alice.client.from("story_views").select("viewer_id").eq("story_id", stories![0]!.id)).data).toHaveLength(1);
    expect((await carol.client.from("story_views").select("viewer_id").eq("story_id", stories![0]!.id)).data).toHaveLength(0);

    // blocked: carol blocks alice and can no longer see her stories
    await carol.client.rpc("block_user", { p_user: alice.id });
    expect((await carol.client.from("stories").select("id").eq("author_id", alice.id)).data).toHaveLength(0);

    // expiry: after 24h others cannot see it, the author still can
    await admin.from("stories").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("author_id", alice.id);
    expect((await bob.client.from("stories").select("id").eq("author_id", alice.id)).data).toHaveLength(0);
    expect((await bob.client.rpc("story_tray")).data?.some((t) => t.author_id === alice.id)).toBe(false);
    expect((await alice.client.from("stories").select("id").eq("author_id", alice.id)).data!.length).toBeGreaterThan(0);

    // daily cap: nine more succeed (one already created), the next is refused
    for (let i = 0; i < 9; i++) {
      expect((await alice.client.rpc("create_story", { p_text: `s${i}`, p_media_url: null as unknown as string, p_kind: "update", p_startup: null as unknown as string })).error).toBeNull();
    }
    expect((await alice.client.rpc("create_story", { p_text: "one too many", p_media_url: null as unknown as string, p_kind: "update", p_startup: null as unknown as string })).error?.message).toContain("story_limit");
  });

  it("mentions: @handle notifies the mentioned member (not self, not blockers) and posts allow at most four images", async () => {
    const post = await alice.client.from("posts").insert({
      author_id: alice.id, category: "ask_community", content: `Thanks @${bob.handle} and @${alice.handle} and @${carol.handle}, plus @nobody_here`,
    });
    expect(post.error).toBeNull();
    expect((await bob.client.from("notifications").select("type").eq("type", "mention")).data).toHaveLength(1);
    expect((await alice.client.from("notifications").select("type").eq("type", "mention")).data ?? []).toHaveLength(0); // self
    expect((await carol.client.from("notifications").select("type").eq("type", "mention")).data ?? []).toHaveLength(0); // blocked alice

    const five = Array.from({ length: 5 }, (_, i) => `https://x.example/${i}.png`);
    expect((await alice.client.from("posts").insert({ author_id: alice.id, category: "ask_community", content: "pics", media_urls: five })).error).not.toBeNull();
    expect((await alice.client.from("posts").insert({ author_id: alice.id, category: "ask_community", content: "pics", media_urls: five.slice(0, 4) })).error).toBeNull();
  });

  it("matching: explains why, filters, and excludes blocked, connected and passed members", async () => {
    const { data: forAlice, error } = await alice.client.rpc("suggested_matches", { p_limit: 20 });
    expect(error).toBeNull();
    const b = forAlice!.find((m) => m.profile_id === bob.id)!;
    expect(b.score).toBeGreaterThanOrEqual(30 + 20 + 15 + 5 + 10); // cofounder both ways, industry, skill, city
    expect(b.reasons.join(" | ")).toMatch(/cofounder/);
    expect(b.reasons.join(" | ")).toMatch(/Both in FinTech/);
    expect(b.reasons.join(" | ")).toMatch(/Shared skills: react/);
    expect(forAlice![0]!.profile_id).toBe(bob.id); // best match first
    expect(forAlice!.some((m) => m.profile_id === alice.id)).toBe(false); // never yourself
    expect(forAlice!.some((m) => m.profile_id === carol.id)).toBe(false); // carol blocked alice
    expect(forAlice!.some((m) => m.profile_id === dave.id)).toBe(false); // dave blocked alice

    // filters
    const mentors = await alice.client.rpc("suggested_matches", { p_limit: 20, p_open_to: "mentor" });
    expect(mentors.data!.map((m) => m.profile_id)).toEqual([bob.id]);

    // pass removes a card; connecting removes it too
    expect((await alice.client.from("discover_passes").insert({ user_id: alice.id, target_id: bob.id })).error).toBeNull();
    expect((await alice.client.rpc("suggested_matches", { p_limit: 20 })).data!.some((m) => m.profile_id === bob.id)).toBe(false);
    // outsiders are refused
    expect((await outsider.client.rpc("suggested_matches", { p_limit: 5 })).error?.code).toBe("42501");
    // someone else's passes are private
    expect((await bob.client.from("discover_passes").select("*")).data ?? []).toHaveLength(0);
  });

  it("mutual connections are visible only to members", async () => {
    // bob <-> carol, bob <-> dave; carol and dave share bob
    const r1 = await carol.client.rpc("request_connection", { p_recipient: bob.id });
    await bob.client.rpc("respond_connection", { p_id: r1.data as string, p_accept: true });
    const r2 = await dave.client.rpc("request_connection", { p_recipient: bob.id });
    await bob.client.rpc("respond_connection", { p_id: r2.data as string, p_accept: true });
    const { data } = await carol.client.rpc("mutual_connections", { p_user: dave.id });
    expect(data?.map((m) => m.id)).toEqual([bob.id]);
    expect((await outsider.client.rpc("mutual_connections", { p_user: dave.id })).data ?? []).toHaveLength(0);
  });

  it("launch board ranks by votes with time decay and crowns exactly one launch of the day", async () => {
    const mk = async (u: User, name: string) => (await u.client.from("product_launches").insert({
      startup_id: u.startupId, founder_id: u.id, name, slug: name.toLowerCase(), tagline: "t", description: "d",
      website_url: `https://${name.toLowerCase()}-${run}.example`, category: "Tools", stage: "mvp",
    }).select("id").single()).data!.id;
    const l1 = await mk(alice, `Alpha${run}`);
    const l2 = await mk(bob, `Beta${run}`);
    await bob.client.from("launch_votes").insert({ launch_id: l1, user_id: bob.id });
    await carol.client.from("launch_votes").insert({ launch_id: l1, user_id: carol.id });
    await alice.client.from("launch_votes").insert({ launch_id: l2, user_id: alice.id });

    const anon = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    const { data: board } = await anon.rpc("launch_board", { p_range: "today" });
    const names = board!.map((l) => l.id);
    expect(names.indexOf(l1)).toBeLessThan(names.indexOf(l2)); // two votes beat one
    expect(board!.filter((l) => l.is_launch_of_day)).toHaveLength(1);
    expect(board![0]!.is_launch_of_day).toBe(true);
    // old launches fall out of "today" but stay in "all"
    await admin.from("product_launches").update({ created_at: new Date(Date.now() - 3 * 86400_000).toISOString() }).eq("id", l2);
    expect((await anon.rpc("launch_board", { p_range: "today" })).data!.some((l) => l.id === l2)).toBe(false);
    expect((await anon.rpc("launch_board", { p_range: "all" })).data!.some((l) => l.id === l2)).toBe(true);
    // one vote per member
    expect((await bob.client.from("launch_votes").insert({ launch_id: l1, user_id: bob.id })).error).not.toBeNull();
  });

  it("search: members find people, the public only finds verified startups and launches, wildcards are escaped", async () => {
    const asMember = await alice.client.rpc("search_all", { q: `bob F` });
    expect(asMember.data!.some((r) => r.kind === "founder" && r.id === bob.id)).toBe(true);

    const anon = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    const pub = await anon.rpc("search_all", { q: `bob` });
    expect(pub.data!.some((r) => r.kind === "founder")).toBe(false);
    expect((await anon.rpc("search_all", { q: `${bob.handle.split("_")[0]} Co` })).data!.some((r) => r.kind === "startup")).toBe(true);

    expect((await alice.client.rpc("search_all", { q: "x" })).data ?? []).toHaveLength(0); // too short
    expect((await alice.client.rpc("search_all", { q: "%%" })).data ?? []).toHaveLength(0); // literal %, not a wildcard
    expect((await outsider.client.rpc("search_all", { q: "bob" })).data!.some((r) => r.kind === "founder")).toBe(false);
  });

  it("milestones: company admins write them, anyone can read verified ones, others cannot", async () => {
    expect((await alice.client.from("startup_milestones").insert({ startup_id: alice.startupId, title: "First 100 users", kind: "milestone", created_by: alice.id })).error).toBeNull();
    expect((await bob.client.from("startup_milestones").insert({ startup_id: alice.startupId, title: "Hijack", kind: "milestone", created_by: bob.id })).error).not.toBeNull();
    const anon = createClient<Database>(URL, ANON, { auth: { persistSession: false } });
    expect((await anon.from("startup_milestones").select("title").eq("startup_id", alice.startupId)).data).toEqual([{ title: "First 100 users" }]);
  });
});
