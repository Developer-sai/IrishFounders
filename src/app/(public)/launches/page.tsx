import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { getSession, isApproved } from "@/lib/auth";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form-controls";
import { buttonVariants } from "@/components/ui/button";
import { Flash } from "@/components/app/flash";
import { addLaunchFeedback, toggleSavedRow, toggleVoteRow } from "@/lib/actions/community";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Launch Day" };

const RANGES = [["today", "Today"], ["week", "This week"], ["all", "All time"]] as const;

export default async function LaunchesPage({ searchParams }: { searchParams: Promise<{ range?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const member = !!session && isApproved(session);
  const supabase = await createClient();
  const range = RANGES.some(([k]) => k === sp.range) ? (sp.range as (typeof RANGES)[number][0]) : "today";

  const { data: board } = await supabase.rpc("launch_board", { p_range: range });
  const launches = board ?? [];
  const ids = launches.map((l) => l.id);

  const [{ data: myVotes }, { data: mySaved }, { data: feedback }] = await Promise.all([
    member && ids.length ? supabase.from("launch_votes").select("launch_id").eq("user_id", session!.id).in("launch_id", ids) : Promise.resolve({ data: [] }),
    member && ids.length ? supabase.from("saved_items").select("item_id").eq("user_id", session!.id).eq("item_type", "launch").in("item_id", ids) : Promise.resolve({ data: [] }),
    member && ids.length ? supabase.from("product_feedback").select("launch_id").in("launch_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const voted = new Set((myVotes ?? []).map((v) => v.launch_id));
  const saved = new Set((mySaved ?? []).map((v) => v.item_id));
  const feedbackCount = new Map<string, number>();
  for (const f of feedback ?? []) feedbackCount.set(f.launch_id, (feedbackCount.get(f.launch_id) ?? 0) + 1);

  const winner = range === "today" ? launches.find((l) => l.is_launch_of_day) : undefined;
  const rest = winner ? launches.filter((l) => l.id !== winner.id) : launches;

  return (
    <div className="py-12">
      <PageHeader
        title="Launch Day"
        description="Real products from verified Irish founders, ranked by support with a freshness boost. Be one of the first to try them."
        action={member && session?.role === "founder" ? <Link href="/launches/new" className={buttonVariants({ variant: "accent", size: "sm" })}>Launch a product</Link> : undefined}
      />
      <Flash error={sp.error} />

      <nav aria-label="Time range" className="mb-8 flex gap-1.5">
        {RANGES.map(([k, label]) => <ChipLink key={k} href={`/launches?range=${k}`} active={range === k}>{label}</ChipLink>)}
      </nav>

      {launches.length === 0 ? (
        <EmptyState
          title={range === "today" ? "No launches in the last 24 hours" : "No launches yet"}
          description="Approved founders launch products here. Check the week or all-time view, or launch yours."
          action={range === "today" ? <Link href="/launches?range=week" className="text-sm underline">See this week</Link> : undefined}
        />
      ) : (
        <>
          {winner ? (
            <article className="mb-10 border border-foreground bg-primary p-6 text-primary-foreground md:p-8" aria-label="Launch of the day">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">★ Launch of the day</p>
              <h2 className="display mt-3 text-4xl md:text-5xl">
                <a href={winner.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{winner.name}</a>
              </h2>
              <p className="mt-3 max-w-xl text-lg opacity-85">{winner.tagline}</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wider opacity-70">
                {winner.category} · {humanize(winner.stage)} · by <Link href={`/startups/${winner.startup_slug}`} className="underline">{winner.startup_name}</Link> · {winner.votes_count} supporters
              </p>
              {member ? (
                <div className="mt-6 [&_button]:border-primary-foreground/40">
                  <ActionButton action={toggleVoteRow} hidden={{ id: winner.id }} label={voted.has(winner.id) ? "Supported" : "Support this launch"} variant="accent" />
                </div>
              ) : null}
            </article>
          ) : null}

          <ol className="border-t border-foreground/80">
            {rest.map((l, i) => (
              <li key={l.id} className="border-b border-border py-6">
                <div className="grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-4 sm:grid-cols-[3.5rem_1fr_auto]">
                  <span className="display tabular text-3xl text-muted-foreground sm:text-4xl">{i + 1 + (winner ? 1 : 0)}</span>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl leading-tight" style={{ fontVariationSettings: '"opsz" 36' }}>
                      <a href={l.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{l.name}</a>
                    </h3>
                    <p className="mt-1 text-foreground/75">{l.tagline}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge>{l.category}</Badge>
                      <Badge>{humanize(l.stage)}</Badge>
                      <Link href={`/startups/${l.startup_slug}`} className="underline underline-offset-2">{l.startup_name}</Link>
                    </div>
                    {member ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Feedback{feedbackCount.get(l.id) ? ` (${feedbackCount.get(l.id)})` : ""}
                        </summary>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ActionButton action={toggleSavedRow} hidden={{ id: l.id, type: "launch", path: "/launches" }} label={saved.has(l.id) ? "Saved" : "Save"} variant="ghost" size="sm" />
                          <ActionForm action={addLaunchFeedback} submitLabel="Send" resetOnSuccess buttonProps={{ size: "sm", variant: "outline" }} className="flex min-w-[240px] flex-1 gap-2">
                            <input type="hidden" name="launch_id" value={l.id} />
                            <Input name="content" placeholder="What would make this better?" aria-label="Feedback" required maxLength={2000} />
                          </ActionForm>
                        </div>
                      </details>
                    ) : null}
                  </div>
                  {member ? (
                    <ActionButton action={toggleVoteRow} hidden={{ id: l.id }} label={`${voted.has(l.id) ? "▲ Supported" : "▲ Support"} · ${l.votes_count}`} variant={voted.has(l.id) ? "accent" : "outline"} size="sm" />
                  ) : (
                    <span className="font-mono text-sm tabular">▲ {l.votes_count}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
