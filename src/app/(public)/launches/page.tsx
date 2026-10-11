import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { humanize, formatDate } from "@/lib/utils";
import { getSession, isApproved } from "@/lib/auth";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { addLaunchFeedback, toggleSavedRow, toggleVoteRow } from "@/lib/actions/community";

export const metadata: Metadata = { title: "Product launches" };

export default async function LaunchesPage({ searchParams }: { searchParams: Promise<{ sort?: string; error?: string }> }) {
  const { sort, error } = await searchParams;
  const session = await getSession();
  const member = !!session && isApproved(session);
  const supabase = await createClient();
  const trending = sort === "trending";

  const { data: launches } = await supabase
    .from("product_launches")
    .select("id, name, slug, tagline, category, stage, votes_count, launch_date, website_url, startups(name, slug)")
    .eq("status", "published")
    .eq("is_demo", false)
    .order(trending ? "votes_count" : "created_at", { ascending: false })
    .limit(50);

  const ids = (launches ?? []).map((l) => l.id);
  const [{ data: myVotes }, { data: mySaved }] = member && ids.length
    ? await Promise.all([
        supabase.from("launch_votes").select("launch_id").eq("user_id", session!.id).in("launch_id", ids),
        supabase.from("saved_items").select("item_id").eq("user_id", session!.id).eq("item_type", "launch").in("item_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const voted = new Set((myVotes ?? []).map((v) => v.launch_id));
  const saved = new Set((mySaved ?? []).map((v) => v.item_id));

  return (
    <div className="py-12">
      <PageHeader
        title="Product launches"
        description="Real products from verified Irish founders."
        action={
          <div className="flex gap-2 text-sm">
            <Link href="/launches" className={!trending ? "font-semibold" : "text-muted-foreground"}>Newest</Link>
            <Link href="/launches?sort=trending" className={trending ? "font-semibold" : "text-muted-foreground"}>Trending</Link>
          </div>
        }
      />
      <Flash error={error} />
      {member && session?.role === "founder" ? <p className="mb-4 text-sm"><Link href="/launches/new" className="underline">Launch your product →</Link></p> : null}
      {launches && launches.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {launches.map((l) => {
            const st = Array.isArray(l.startups) ? l.startups[0] : l.startups;
            return (
              <li key={l.id}>
                <Card>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a href={l.website_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{l.name}</a>
                        <p className="text-sm text-muted-foreground">{l.tagline}</p>
                      </div>
                      {member ? (
                        <ActionButton action={toggleVoteRow} hidden={{ id: l.id }} label={`${voted.has(l.id) ? "Supported" : "Support"} · ${l.votes_count}`} variant={voted.has(l.id) ? "accent" : "outline"} size="sm" />
                      ) : <span className="text-sm font-medium">{l.votes_count} supporters</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge>{l.category}</Badge>
                      <Badge>{humanize(l.stage)}</Badge>
                      <span className="text-muted-foreground">{formatDate(l.launch_date)}</span>
                      {st ? <Link href={`/startups/${st.slug}`} className="underline">{st.name}</Link> : null}
                    </div>
                    {member ? (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <ActionButton action={toggleSavedRow} hidden={{ id: l.id, type: "launch", path: "/launches" }} label={saved.has(l.id) ? "Saved" : "Save"} variant="ghost" size="sm" />
                        <ActionForm action={addLaunchFeedback} submitLabel="Send" resetOnSuccess buttonProps={{ size: "sm", variant: "outline" }} className="flex flex-1 gap-2">
                          <input type="hidden" name="launch_id" value={l.id} />
                          <Input name="content" placeholder="Give feedback…" aria-label="Feedback" required maxLength={2000} />
                        </ActionForm>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No launches yet" description="Approved founders can launch their products from their dashboard." />
      )}
    </div>
  );
}
