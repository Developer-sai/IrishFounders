import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession, isApproved } from "@/lib/auth";
import { Avatar, Badge, Seal } from "@/components/ui/card";
import { Chip, OFFERING_LABELS, OPEN_TO_LABELS } from "@/components/ui/chip";
import { CoverImage } from "@/components/ui/cover-image";
import { buttonVariants } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-form";
import { Flash } from "@/components/app/flash";
import { followUserRow, unfollowUserRow } from "@/lib/actions/social";
import { requestConnectionRow } from "@/lib/actions/community";
import { formatDate, humanize } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadFounder(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("public_founders").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const f = await loadFounder(id);
  return f
    ? { title: f.full_name ?? "Founder", description: f.headline ?? "Verified founder on Irish Founders" }
    : { title: "Founder not found" };
}

export default async function FounderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const founder = await loadFounder(id);
  if (!founder || !founder.id) notFound();

  const supabase = await createClient();
  const session = await getSession();
  const member = !!session && isApproved(session);
  const isSelf = session?.id === founder.id;
  const path = `/founders/${founder.id}`;

  // Team rows come from the public view: members cannot read other people's startup_members rows directly.
  const [{ data: teamRows }, { data: launches }] = await Promise.all([
    supabase.from("public_startup_team").select("startup_id, role_title").eq("profile_id", founder.id),
    supabase.from("product_launches").select("id, name, tagline, votes_count").eq("founder_id", founder.id).eq("status", "published").order("created_at", { ascending: false }).limit(6),
  ]);
  const teamIds = (teamRows ?? []).flatMap((t) => (t.startup_id ? [t.startup_id] : []));
  const { data: startupRows } = teamIds.length
    ? await supabase.from("startups").select("id, name, slug, industry").in("id", teamIds).eq("is_verified", true)
    : { data: [] };
  const startups = (startupRows ?? []).map((s) => ({
    ...s,
    role_title: (teamRows ?? []).find((t) => t.startup_id === s.id)?.role_title ?? "Founder",
  }));
  const startupIds = startups.map((s) => s.id);

  const [{ data: milestones }, memberData] = await Promise.all([
    startupIds.length
      ? supabase.from("startup_milestones").select("id, startup_id, title, occurred_on, kind").in("startup_id", startupIds).order("occurred_on", { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),
    member
      ? Promise.all([
          supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", founder.id),
          supabase.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", founder.id),
          supabase.from("follows").select("follower_id").eq("follower_id", session!.id).eq("followed_id", founder.id).maybeSingle(),
          supabase.from("connections").select("status, requester_id, recipient_id"),
          isSelf ? Promise.resolve({ data: [] }) : supabase.rpc("mutual_connections", { p_user: founder.id }),
          supabase.from("posts").select("id, content, media_urls, category").eq("author_id", founder.id).eq("status", "published").order("created_at", { ascending: false }).limit(9),
        ])
      : null,
  ]);

  const followers = memberData?.[0].count ?? null;
  const following = memberData?.[1].count ?? null;
  const iFollow = !!memberData?.[2].data;
  const conn = memberData?.[3].data?.find((c) => c.requester_id === founder.id || c.recipient_id === founder.id);
  const mutual = memberData?.[4].data ?? [];
  const posts = memberData?.[5].data ?? [];

  type Tile =
    | { kind: "post"; id: string; text: string; image: string | null; label: string }
    | { kind: "launch"; id: string; text: string; sub: string };
  const tiles: Tile[] = [
    ...posts.map((p): Tile => ({ kind: "post", id: p.id, text: p.content, image: p.media_urls[0] ?? null, label: humanize(p.category) })),
    ...(launches ?? []).map((l): Tile => ({ kind: "launch", id: l.id, text: l.name, sub: l.tagline })),
  ];

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="-mx-5 h-40 overflow-hidden border-b border-foreground/80 sm:mx-0 sm:h-56 sm:border">
        <CoverImage src={founder.cover_url} />
      </div>

      <header className="relative px-1">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
          <span className="relative inline-flex rounded-full border-4 border-background">
            <Avatar name={founder.full_name} src={founder.avatar_url} size={96} />
            <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-background"><Seal label="Verified founder: approved membership" className="h-6 w-6" /></span>
          </span>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {isSelf ? (
              <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>Edit profile</Link>
            ) : member ? (
              <>
                {iFollow
                  ? <ActionButton action={unfollowUserRow} hidden={{ id: founder.id, path }} label="Following" variant="outline" size="sm" />
                  : <ActionButton action={followUserRow} hidden={{ id: founder.id, path }} label="Follow" variant="accent" size="sm" />}
                {conn?.status === "accepted"
                  ? <Link href="/messages" className={buttonVariants({ variant: "primary", size: "sm" })}>Message</Link>
                  : conn?.status === "pending"
                    ? <Badge>Request pending</Badge>
                    : conn ? null : <ActionButton action={requestConnectionRow} hidden={{ id: founder.id, path }} label="Connect" variant="primary" size="sm" />}
              </>
            ) : (
              <Link href="/signup" className={buttonVariants({ variant: "accent", size: "sm" })}>Apply to connect</Link>
            )}
          </div>
        </div>

        <h1 className="display mt-4 text-4xl md:text-5xl">{founder.full_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {founder.handle ? <span className="font-mono">@{founder.handle}</span> : null}
          {founder.headline ? <span>{founder.headline}</span> : null}
          {founder.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{founder.location}</span> : null}
        </p>

        {member ? (
          <p className="mt-4 flex gap-6 font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
            <span><strong className="tabular text-foreground">{followers ?? 0}</strong> followers</span>
            <span><strong className="tabular text-foreground">{following ?? 0}</strong> following</span>
            {mutual.length > 0 ? <span><strong className="tabular text-foreground">{mutual.length}</strong> mutual</span> : null}
          </p>
        ) : null}
        <div className="mt-4"><Flash error={error} /></div>
      </header>

      {founder.bio ? <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed">{founder.bio}</p> : null}

      {(founder.open_to?.length ?? 0) > 0 || (founder.offering?.length ?? 0) > 0 ? (
        <section className="mt-8 grid gap-6 border-t border-foreground/80 pt-6 sm:grid-cols-2" aria-label="Open to">
          {(founder.open_to?.length ?? 0) > 0 ? (
            <div><p className="eyebrow mb-3">Looking for</p><div className="flex flex-wrap gap-1.5">{founder.open_to!.map((o) => <Chip key={o} tone="accent">{OPEN_TO_LABELS[o] ?? o}</Chip>)}</div></div>
          ) : null}
          {(founder.offering?.length ?? 0) > 0 ? (
            <div><p className="eyebrow mb-3">Can offer</p><div className="flex flex-wrap gap-1.5">{founder.offering!.map((o) => <Chip key={o} tone="verified">{OFFERING_LABELS[o] ?? o}</Chip>)}</div></div>
          ) : null}
        </section>
      ) : null}

      {startups.length > 0 ? (
        <section className="mt-8 border-t border-foreground/80 pt-6" aria-label="Startups">
          <p className="eyebrow mb-4">Startups</p>
          <ul className="space-y-6">
            {startups.map((s) => {
              const ms = (milestones ?? []).filter((m) => m.startup_id === s.id).slice(0, 4);
              return (
                <li key={s.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/startups/${s.slug}`} className="inline-flex items-center gap-2 font-display text-2xl hover:underline">
                      {s.name}<Seal label="Verified startup" />
                    </Link>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{s.role_title} · {s.industry}</span>
                  </div>
                  {ms.length > 0 ? (
                    <ol className="mt-3 border-l border-border pl-5">
                      {ms.map((m) => (
                        <li key={m.id} className="relative pb-3 last:pb-0">
                          <span aria-hidden className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-foreground bg-background" />
                          <p className="text-sm">{m.title}</p>
                          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{formatDate(m.occurred_on)} · {humanize(m.kind)}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {mutual.length > 0 ? (
        <section className="mt-8 border-t border-foreground/80 pt-6" aria-label="Mutual connections">
          <p className="eyebrow mb-3">Mutual connections</p>
          <ul className="flex flex-wrap gap-3">
            {mutual.map((m) => (
              <li key={m.id}><Link href={`/founders/${m.id}`} className="flex items-center gap-2 text-sm hover:underline"><Avatar name={m.full_name} src={m.avatar_url} size={28} />{m.full_name}</Link></li>
            ))}
          </ul>
        </section>
      ) : null}

      {tiles.length > 0 ? (
        <section className="mt-8 border-t border-foreground/80 pt-6" aria-label="Activity">
          <p className="eyebrow mb-4">Activity</p>
          <ul className="grid grid-cols-3 gap-0.5">
            {tiles.map((t) => (
              <li key={`${t.kind}-${t.id}`} className="relative aspect-square overflow-hidden bg-card">
                {t.kind === "post" && t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : t.kind === "post" ? (
                  <div className="flex h-full flex-col justify-between border border-border p-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{t.label}</span>
                    <p className="line-clamp-5 font-display text-[13px] leading-snug sm:text-base">{t.text}</p>
                  </div>
                ) : (
                  <Link href="/launches" className="flex h-full flex-col justify-between bg-primary p-3 text-primary-foreground">
                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">Launch</span>
                    <span><span className="block font-display text-base leading-tight sm:text-xl">{t.text}</span><span className="mt-1 line-clamp-2 block text-[11px] opacity-70">{t.sub}</span></span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-foreground/80 pt-6" aria-label="Skills and links">
        {founder.skills && founder.skills.length > 0 ? founder.skills.map((s) => <Chip key={s}>{s}</Chip>) : null}
        {founder.linkedin_url ? (
          <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="ml-auto inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
            <ExternalLink className="h-4 w-4" aria-hidden /> LinkedIn
          </a>
        ) : null}
      </section>
    </div>
  );
}
