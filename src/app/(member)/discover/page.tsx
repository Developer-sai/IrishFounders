import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState, PageHeader, Seal } from "@/components/ui/card";
import { Chip, ChipLink, OFFERING_LABELS, OPEN_TO_LABELS } from "@/components/ui/chip";
import { CoverImage } from "@/components/ui/cover-image";
import { ActionButton } from "@/components/ui/action-form";
import { Flash } from "@/components/app/flash";
import { requestConnectionRow } from "@/lib/actions/community";
import { followUserRow, passMatchRow } from "@/lib/actions/social";

export const metadata: Metadata = { title: "Discover" };

type SP = { open_to?: string; error?: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();
  const openTo = sp.open_to && sp.open_to in OPEN_TO_LABELS ? sp.open_to : undefined;

  const [{ data: matches }, { count: poolSize }, { data: follows }] = await Promise.all([
    supabase.rpc("suggested_matches", { p_limit: 12, p_open_to: openTo ?? (null as unknown as string) }),
    supabase.from("public_founders").select("id", { count: "exact", head: true }).eq("is_demo", false),
    supabase.from("follows").select("followed_id").eq("follower_id", session.id),
  ]);
  const list = matches ?? [];
  const top = list[0];
  const following = new Set((follows ?? []).map((f) => f.followed_id));
  const here = `/discover${openTo ? `?open_to=${openTo}` : ""}`;
  const noProfileSignals = session.open_to.length === 0 && session.offering.length === 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Discover"
        description="Verified founders matched to what you're looking for. Every match shows its reasons, so you can judge it yourself."
      />
      <Flash error={sp.error} />

      {noProfileSignals ? (
        <p className="mb-6 border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          Matches get much better when you say what you&apos;re looking for.{" "}
          <Link href="/settings" className="font-medium underline">Update your profile</Link>
        </p>
      ) : null}

      <nav aria-label="Filter by what they want" className="mb-6 flex flex-wrap gap-1.5">
        <ChipLink href="/discover" active={!openTo}>Everyone</ChipLink>
        {Object.entries(OPEN_TO_LABELS).map(([k, label]) => (
          <ChipLink key={k} href={`/discover?open_to=${k}`} active={openTo === k}>{label}</ChipLink>
        ))}
      </nav>

      {top ? (
        <>
          <p className="eyebrow mb-3" aria-live="polite">Match 1 of {list.length}</p>
          <article className="border border-foreground bg-card" aria-label={`Match: ${top.full_name}`}>
            <div className="h-28 overflow-hidden border-b border-border"><CoverImage src={top.cover_url} /></div>
            <div className="px-6 pb-6">
              <div className="-mt-10 flex items-end justify-between gap-4">
                <span className="relative inline-flex rounded-full border-4 border-card">
                  <Avatar name={top.full_name} src={top.avatar_url} size={80} />
                  <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-card"><Seal label="Verified founder" className="h-6 w-6" /></span>
                </span>
                <Link href={`/founders/${top.profile_id}`} className="pb-1 text-sm underline underline-offset-4">View full profile</Link>
              </div>
              <h2 className="display mt-3 text-3xl">{top.full_name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                {top.handle ? <span className="font-mono">@{top.handle}</span> : null}
                {top.headline ? <span>{top.headline}</span> : null}
                {top.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{top.location}</span> : null}
              </p>

              <div className="mt-6 border-t border-foreground/80 pt-4">
                <p className="eyebrow mb-3">Why you match</p>
                {top.reasons.length > 0 ? (
                  <ul className="space-y-1.5 text-sm">
                    {top.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2"><span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />{r}</li>
                    ))}
                    {top.mutual > 0 ? <li className="flex items-start gap-2"><span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />{top.mutual} mutual connection{top.mutual === 1 ? "" : "s"}</li> : null}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">A new verified founder. No overlap with your profile yet, so say hello and find out.</p>
                )}
              </div>

              {(top.open_to.length > 0 || top.offering.length > 0) ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {top.open_to.map((o) => <Chip key={`o-${o}`} tone="accent">Wants {OPEN_TO_LABELS[o]?.toLowerCase() ?? o}</Chip>)}
                  {top.offering.map((o) => <Chip key={`f-${o}`} tone="verified">Offers {OFFERING_LABELS[o]?.toLowerCase() ?? o}</Chip>)}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <ActionButton action={passMatchRow} hidden={{ id: top.profile_id, path: here }} label="Pass" variant="outline" />
                {following.has(top.profile_id)
                  ? <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Following</span>
                  : <ActionButton action={followUserRow} hidden={{ id: top.profile_id, path: here }} label="Follow" variant="ghost" />}
                <span className="ml-auto"><ActionButton action={requestConnectionRow} hidden={{ id: top.profile_id, path: here }} label="Connect" variant="accent" /></span>
              </div>
            </div>
          </article>

          {list.length > 1 ? (
            <section className="mt-8" aria-label="Up next">
              <p className="eyebrow mb-3">Up next</p>
              <ul className="flex gap-4 overflow-x-auto pb-2">
                {list.slice(1, 7).map((m) => (
                  <li key={m.profile_id} className="shrink-0">
                    <Link href={`/founders/${m.profile_id}`} className="flex w-20 flex-col items-center gap-1.5 text-center">
                      <Avatar name={m.full_name} src={m.avatar_url} size={56} />
                      <span className="w-full truncate text-[11px]">{m.full_name.split(" ")[0]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={openTo ? "No one matches that filter yet" : "You've seen everyone for now"}
          description={`There ${poolSize === 1 ? "is" : "are"} ${poolSize ?? 0} verified founder${poolSize === 1 ? "" : "s"} on Irish Founders so far. New members are approved by hand, so check back soon, or invite a founder you trust to apply.`}
          action={openTo ? <Link href="/discover" className="text-sm underline">Clear filter</Link> : <Link href="/feed" className="text-sm underline">Back to the feed</Link>}
        />
      )}
    </div>
  );
}
