import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import {
  addComment, createPost, deletePostRow, reportContent, toggleReactionRow, toggleSavedRow,
} from "@/lib/actions/community";
import { POST_CATEGORIES } from "@/lib/constants";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Community feed" };
const PAGE_SIZE = 10;

type SP = { category?: string; page?: string; error?: string };

export default async function FeedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const category = (POST_CATEGORIES as readonly string[]).includes(sp.category ?? "") ? (sp.category as (typeof POST_CATEGORIES)[number]) : undefined;

  let q = supabase
    .from("posts")
    .select("id, author_id, category, title, content, media_urls, external_link, reactions_count, comments_count, created_at, startup_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  if (category) q = q.eq("category", category);
  const [{ data: rows }, { data: myStartups }] = await Promise.all([
    q,
    supabase.from("startup_members").select("startups(id, name)").eq("profile_id", session.id),
  ]);
  const hasMore = (rows?.length ?? 0) > PAGE_SIZE;
  const posts = (rows ?? []).slice(0, PAGE_SIZE);

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const [{ data: authors }, { data: comments }, { data: myReactions }, { data: mySaved }] = await Promise.all([
    authorIds.length ? supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", authorIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("post_comments").select("id, post_id, author_id, content, created_at").eq("status", "published").in("post_id", postIds).order("created_at") : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("post_reactions").select("post_id").eq("user_id", session.id).in("post_id", postIds) : Promise.resolve({ data: [] }),
    postIds.length ? supabase.from("saved_items").select("item_id").eq("user_id", session.id).eq("item_type", "post").in("item_id", postIds) : Promise.resolve({ data: [] }),
  ]);
  const commentAuthorIds = [...new Set((comments ?? []).map((c) => c.author_id))].filter((id) => !authorIds.includes(id));
  const { data: extraAuthors } = commentAuthorIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", commentAuthorIds)
    : { data: [] };
  const people = new Map([...(authors ?? []), ...(extraAuthors ?? [])].map((a) => [a.id, a]));
  const reacted = new Set((myReactions ?? []).map((r) => r.post_id));
  const saved = new Set((mySaved ?? []).map((r) => r.item_id));

  const startupOptions = (myStartups ?? []).flatMap((m) => (Array.isArray(m.startups) ? m.startups : m.startups ? [m.startups] : []));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Community feed" description="Updates, questions and milestones from verified members." />
      <Flash error={sp.error} />

      <Card className="mb-6">
        <CardContent>
          <ActionForm action={createPost} submitLabel="Post" resetOnSuccess successMessage="Posted." buttonProps={{ variant: "accent" }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="category">
                <Select id="category" name="category" defaultValue="building_in_public">
                  {POST_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
                </Select>
              </Field>
              {startupOptions.length ? (
                <Field label="On behalf of (optional)" htmlFor="startup_id">
                  <Select id="startup_id" name="startup_id" defaultValue="">
                    <option value="">Just me</option>
                    {startupOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
              ) : null}
            </div>
            <Field label="Title (optional)" htmlFor="title"><Input id="title" name="title" maxLength={150} /></Field>
            <Field label="What's happening?" htmlFor="content"><Textarea id="content" name="content" required maxLength={5000} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link (optional)" htmlFor="external_link"><Input id="external_link" name="external_link" placeholder="https://…" /></Field>
              <Field label="Image (optional)" htmlFor="image"><Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" /></Field>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <nav aria-label="Filter by category" className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/feed" className={`rounded-full px-3 py-1 ${!category ? "bg-primary text-primary-foreground" : "bg-muted"}`}>All</Link>
        {POST_CATEGORIES.map((c) => (
          <Link key={c} href={`/feed?category=${c}`} className={`rounded-full px-3 py-1 ${category === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{humanize(c)}</Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Be the first to share an update with the community." />
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => {
            const author = people.get(p.author_id);
            const postComments = (comments ?? []).filter((c) => c.post_id === p.id);
            return (
              <li key={p.id}>
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/founders/${p.author_id}`} className="flex items-center gap-3">
                        <Avatar name={author?.full_name ?? null} src={author?.avatar_url} />
                        <span>
                          <span className="block text-sm font-medium">{author?.full_name ?? "Member"}</span>
                          <span className="block text-xs text-muted-foreground">{formatDate(p.created_at, true)}</span>
                        </span>
                      </Link>
                      <Badge>{humanize(p.category)}</Badge>
                    </div>
                    {p.title ? <h2 className="font-semibold">{p.title}</h2> : null}
                    <p className="whitespace-pre-wrap text-sm">{p.content}</p>
                    {p.media_urls.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} src={u} alt="" className="max-h-80 rounded-md object-cover" />
                    ))}
                    {p.external_link ? <a href={p.external_link} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-sm underline">{p.external_link}</a> : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
                      <ActionButton action={toggleReactionRow} hidden={{ id: p.id }} label={`${reacted.has(p.id) ? "Liked" : "Like"} · ${p.reactions_count}`} variant={reacted.has(p.id) ? "accent" : "outline"} size="sm" />
                      <ActionButton action={toggleSavedRow} hidden={{ id: p.id, type: "post", path: "/feed" }} label={saved.has(p.id) ? "Saved" : "Save"} variant="ghost" size="sm" />
                      {p.author_id === session.id ? (
                        <ActionButton action={deletePostRow} hidden={{ id: p.id }} label="Delete" variant="ghost" size="sm" />
                      ) : (
                        <details className="ml-auto">
                          <summary className="cursor-pointer text-xs text-muted-foreground">Report</summary>
                          <ActionForm action={reportContent} submitLabel="Send report" successMessage="Thanks, a moderator will review this." buttonProps={{ size: "sm", variant: "outline" }} className="mt-2 space-y-2">
                            <input type="hidden" name="target_type" value="post" />
                            <input type="hidden" name="target_id" value={p.id} />
                            <Textarea name="reason" placeholder="What's wrong with this post?" required minLength={3} />
                          </ActionForm>
                        </details>
                      )}
                    </div>

                    {postComments.length ? (
                      <ul className="space-y-2 border-t border-border pt-3">
                        {postComments.map((c) => (
                          <li key={c.id} className="text-sm">
                            <span className="font-medium">{people.get(c.author_id)?.full_name ?? "Member"}</span>{" "}
                            <span className="text-muted-foreground">{c.content}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <ActionForm action={addComment} submitLabel="Reply" resetOnSuccess buttonProps={{ size: "sm", variant: "outline" }} className="flex gap-2">
                      <input type="hidden" name="post_id" value={p.id} />
                      <Input name="content" placeholder="Write a comment…" aria-label="Comment" required maxLength={2000} />
                    </ActionForm>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex justify-between text-sm">
        {page > 1 ? <Link href={`/feed?page=${page - 1}${category ? `&category=${category}` : ""}`} className="underline">← Newer</Link> : <span />}
        {hasMore ? <Link href={`/feed?page=${page + 1}${category ? `&category=${category}` : ""}`} className="underline">Older →</Link> : null}
      </div>
    </div>
  );
}
