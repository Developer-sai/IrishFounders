import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { StoryRing } from "@/components/ui/story-ring";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { LikeButton } from "@/components/feed/like-button";
import { Composer } from "@/components/feed/composer";
import { PostMedia } from "@/components/feed/post-media";
import { StoryTray, type StoryGroup } from "@/components/stories/story-tray";
import { addComment, createPost, deletePostRow, reportContent, toggleSavedRow } from "@/lib/actions/community";
import { POST_CATEGORIES } from "@/lib/constants";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };
const PAGE_SIZE = 10;

type SP = { tab?: string; category?: string; page?: string; error?: string };
const TABS = [["foryou", "For you"], ["following", "Following"], ["startups", "Startups"]] as const;

export default async function FeedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();
  const tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as (typeof TABS)[number][0]) : "foryou";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const category = (POST_CATEGORIES as readonly string[]).includes(sp.category ?? "")
    ? (sp.category as (typeof POST_CATEGORIES)[number]) : undefined;

  /* ---------------- stories */
  const { data: tray } = await supabase.rpc("story_tray");
  const trayIds = (tray ?? []).map((t) => t.author_id);
  const [{ data: storyRows }, { data: viewed }] = trayIds.length
    ? await Promise.all([
        supabase.from("stories").select("id, author_id, kind, text, media_url, created_at")
          .in("author_id", trayIds).gt("expires_at", new Date().toISOString()).order("created_at"),
        supabase.from("story_views").select("story_id").eq("viewer_id", session.id),
      ])
    : [{ data: [] }, { data: [] }];
  const seen = new Set((viewed ?? []).map((v) => v.story_id));
  const groups: StoryGroup[] = (tray ?? []).map((t) => ({
    authorId: t.author_id,
    name: t.full_name,
    avatar: t.avatar_url,
    handle: t.handle,
    isMe: t.author_id === session.id,
    stories: (storyRows ?? []).filter((s) => s.author_id === t.author_id)
      .map((s) => ({ id: s.id, kind: s.kind, text: s.text, media_url: s.media_url, created_at: s.created_at, seen: t.author_id === session.id || seen.has(s.id) })),
  })).filter((g) => g.stories.length > 0);

  /* ---------------- posts */
  let followedIds: string[] = [];
  if (tab === "following") {
    const { data } = await supabase.from("follows").select("followed_id").eq("follower_id", session.id);
    followedIds = [...(data ?? []).map((f) => f.followed_id), session.id];
  }
  let q = supabase
    .from("posts")
    .select("id, author_id, startup_id, category, title, content, media_urls, external_link, reactions_count, comments_count, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (category) q = q.eq("category", category);
  if (tab === "following") q = q.in("author_id", followedIds);
  if (tab === "startups") q = q.not("startup_id", "is", null);
  const [{ data: rows }, { data: myStartups }] = await Promise.all([
    q,
    supabase.from("startup_members").select("startups(id, name)").eq("profile_id", session.id),
  ]);
  const hasMore = (rows?.length ?? 0) > PAGE_SIZE;
  const posts = (rows ?? []).slice(0, PAGE_SIZE);

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const [{ data: authors }, { data: comments }, { data: myReactions }, { data: mySaved }, { data: founderRows }] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", authorIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("post_comments").select("id, post_id, author_id, content, created_at").eq("status", "published").in("post_id", postIds).order("created_at") : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("post_reactions").select("post_id").eq("user_id", session.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("saved_items").select("item_id").eq("user_id", session.id).eq("item_type", "post").in("item_id", postIds) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from("public_founders").select("id").in("id", authorIds) : Promise.resolve({ data: [] }),
  ]);
  const commentAuthorIds = [...new Set((comments ?? []).map((c) => c.author_id))].filter((i) => !authorIds.includes(i));
  const { data: extraAuthors } = commentAuthorIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", commentAuthorIds)
    : { data: [] };
  const people = new Map([...(authors ?? []), ...(extraAuthors ?? [])].map((a) => [a.id, a]));
  const reacted = new Set((myReactions ?? []).map((r) => r.post_id));
  const saved = new Set((mySaved ?? []).map((r) => r.item_id));
  const verifiedFounders = new Set((founderRows ?? []).map((f) => f.id));
  const hasStory = new Map(groups.map((g) => [g.authorId, g.stories.some((s) => !s.seen) ? "unseen" as const : "seen" as const]));
  const startupOptions = (myStartups ?? []).flatMap((m) => (Array.isArray(m.startups) ? m.startups : m.startups ? [m.startups] : []));
  const qs = (extra: Record<string, string | number>) =>
    `?${new URLSearchParams({ tab, ...(category ? { category } : {}), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Flash error={sp.error} />
      <StoryTray groups={groups} meName={session.full_name} meAvatar={session.avatar_url} />

      <Composer prompt="What are you building today?">
          <ActionForm action={createPost} submitLabel="Post" resetOnSuccess successMessage="Posted." buttonProps={{ variant: "accent" }}>
            <Field label="What are you building today?" htmlFor="content" hint="Mention members with @handle.">
              <Textarea id="content" name="content" required maxLength={5000} placeholder="Share progress, ask a question, ask for feedback…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="category">
                <Select id="category" name="category" defaultValue="building_in_public">
                  {POST_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
                </Select>
              </Field>
              {startupOptions.length ? (
                <Field label="On behalf of" htmlFor="startup_id">
                  <Select id="startup_id" name="startup_id" defaultValue="">
                    <option value="">Just me</option>
                    {startupOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Image (optional)" htmlFor="image"><Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" /></Field>
              <Field label="Link (optional)" htmlFor="external_link"><Input id="external_link" name="external_link" placeholder="https://…" /></Field>
            </div>
          </ActionForm>
      </Composer>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-foreground/20 pb-3">
        <nav aria-label="Feed" className="flex gap-6">
          {TABS.map(([k, label]) => (
            <Link key={k} href={`/feed?tab=${k}`} aria-current={tab === k ? "page" : undefined}
              className={`-mb-[13px] border-b-2 pb-3 text-sm font-medium transition-colors ${tab === k ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          <ChipLink href={`/feed?tab=${tab}`} active={!category}>All</ChipLink>
          {POST_CATEGORIES.slice(0, 4).map((c) => <ChipLink key={c} href={`/feed?tab=${tab}&category=${c}`} active={category === c}>{humanize(c)}</ChipLink>)}
        </nav>
      </div>

      {posts.length === 0 ? (
        tab === "following" ? (
          <EmptyState title="Nobody followed yet" description="Follow founders you want to hear from and their updates will show here." action={<Link href="/discover" className="text-sm underline">Find founders to follow</Link>} />
        ) : (
          <EmptyState title="No posts yet" description="Be the first to share an update with the community." />
        )
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => {
            const author = people.get(p.author_id);
            const postComments = (comments ?? []).filter((c) => c.post_id === p.id);
            return (
              <li key={p.id}>
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/founders/${p.author_id}`} className="flex min-w-0 items-center gap-3">
                        <StoryRing name={author?.full_name ?? null} src={author?.avatar_url} size={40} state={hasStory.get(p.author_id) ?? "none"} verified={verifiedFounders.has(p.author_id)} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{author?.full_name ?? "Member"}</span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">{author?.headline ? `${author.headline} · ` : ""}{formatDate(p.created_at)}</span>
                        </span>
                      </Link>
                      <Badge>{humanize(p.category)}</Badge>
                    </div>
                    {p.title ? <h2 className="font-display text-2xl leading-tight">{p.title}</h2> : null}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{p.content}</p>
                    <PostMedia urls={p.media_urls} />
                    {p.external_link ? <a href={p.external_link} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm underline">{p.external_link}</a> : null}

                    <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2">
                      <LikeButton postId={p.id} liked={reacted.has(p.id)} count={p.reactions_count} />
                      <a href={`#c-${p.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[13px] text-foreground/70 hover:bg-muted" aria-label={`${p.comments_count} comments`}>
                        <MessageCircle className="h-4 w-4" aria-hidden /><span className="tabular">{p.comments_count}</span>
                      </a>
                      <ActionButton action={toggleSavedRow} hidden={{ id: p.id, type: "post", path: "/feed" }} label={saved.has(p.id) ? "Saved" : "Save"} variant="ghost" size="sm" />
                      {p.author_id === session.id ? (
                        <span className="ml-auto"><ActionButton action={deletePostRow} hidden={{ id: p.id }} label="Delete" variant="ghost" size="sm" /></span>
                      ) : (
                        <details className="relative ml-auto">
                          <summary className="cursor-pointer list-none px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Report</summary>
                          <div className="absolute right-0 z-10 mt-1 w-72 border border-foreground bg-card p-3">
                            <ActionForm action={reportContent} submitLabel="Send report" successMessage="Thanks, a moderator will review this." buttonProps={{ size: "sm", variant: "outline" }} className="space-y-2">
                              <input type="hidden" name="target_type" value="post" />
                              <input type="hidden" name="target_id" value={p.id} />
                              <Textarea name="reason" placeholder="What's wrong with this post?" required minLength={3} />
                            </ActionForm>
                          </div>
                        </details>
                      )}
                    </div>

                    <div id={`c-${p.id}`} className="scroll-mt-24 space-y-2">
                      {postComments.map((c) => (
                        <p key={c.id} className="text-sm">
                          <Link href={`/founders/${c.author_id}`} className="font-medium hover:underline">{people.get(c.author_id)?.full_name ?? "Member"}</Link>{" "}
                          <span className="text-foreground/75">{c.content}</span>
                        </p>
                      ))}
                      <ActionForm action={addComment} submitLabel="Reply" resetOnSuccess buttonProps={{ size: "sm", variant: "outline" }} className="flex gap-2">
                        <input type="hidden" name="post_id" value={p.id} />
                        <Input name="content" placeholder="Add a comment…" aria-label="Comment" required maxLength={2000} />
                      </ActionForm>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex justify-between text-sm">
        {page > 1 ? <Link href={`/feed${qs({ page: page - 1 })}`} className="underline">← Newer</Link> : <span />}
        {hasMore ? <Link href={`/feed${qs({ page: page + 1 })}`} className="underline">Older →</Link> : null}
      </div>
    </div>
  );
}
