import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card, CardContent, CardHeader, CardTitle, EmptyState, Seal } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { CoverImage } from "@/components/ui/cover-image";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Field, Textarea } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { claimStartup } from "@/lib/actions/community";
import { toggleStartupFollowRow } from "@/lib/actions/social";
import { getSession, isApproved } from "@/lib/auth";
import { formatDate, humanize } from "@/lib/utils";

type Params = { slug: string };

async function loadStartup(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("startups").select("*").eq("slug", slug).eq("is_verified", true).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStartup(slug);
  return s ? { title: s.name, description: s.short_description } : { title: "Startup not found" };
}

export default async function StartupPage({
  params, searchParams,
}: { params: Promise<Params>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const startup = await loadStartup(slug);
  if (!startup) notFound();

  const supabase = await createClient();
  const session = await getSession();
  const member = !!session && isApproved(session);
  const [{ data: team }, { data: launches }, { data: milestones }, followRow] = await Promise.all([
    supabase.from("public_startup_team").select("*").eq("startup_id", startup.id),
    supabase.from("product_launches").select("id, name, slug, tagline, votes_count").eq("startup_id", startup.id).eq("status", "published").order("created_at", { ascending: false }).limit(5),
    supabase.from("startup_milestones").select("id, title, occurred_on, kind").eq("startup_id", startup.id).order("occurred_on", { ascending: false }).limit(10),
    member ? supabase.from("startup_follows").select("startup_id").eq("user_id", session!.id).eq("startup_id", startup.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const following = !!followRow.data;
  const canClaim = session?.role === "founder" && member && !(team ?? []).some((m) => m.profile_id === session.id);
  const path = `/startups/${startup.slug}`;

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="-mx-5 h-36 overflow-hidden border-b border-foreground/20 sm:mx-0 sm:h-48 sm:border"><CoverImage src={null} /></div>

      <header className="px-1">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          {startup.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={startup.logo_url} alt="" className="h-20 w-20 border-4 border-background bg-card object-cover" />
          ) : (
            <span aria-hidden className="flex h-20 w-20 items-center justify-center border-4 border-background bg-primary font-display text-4xl text-primary-foreground">{startup.name[0]}</span>
          )}
          <div className="flex items-center gap-2 pb-1">
            {member ? (
              <ActionButton action={toggleStartupFollowRow} hidden={{ id: startup.id, path }} label={following ? "Following" : "Follow"} variant={following ? "outline" : "accent"} size="sm" />
            ) : null}
            <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-foreground/25 px-3 text-[13px] hover:border-foreground">
              <Globe className="h-3.5 w-3.5" aria-hidden /> Website
            </a>
            <a href={startup.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-foreground/25 px-3 text-[13px] hover:border-foreground">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden /> LinkedIn
            </a>
          </div>
        </div>
        <h1 className="display mt-4 flex items-center gap-3 text-4xl md:text-5xl">
          {startup.name}
          <Seal label="Verified startup: company reviewed" className="h-7 w-7" />
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{startup.location ?? "Worldwide"}</span>
          <span>Founded {startup.founded_year}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Chip>{startup.industry}</Chip><Chip>{humanize(startup.stage)}</Chip>
          <Chip>{startup.team_size} {startup.team_size === 1 ? "person" : "people"}</Chip>
        </div>
        <div className="mt-4"><Flash error={error} /></div>
      </header>

      <section className="mt-8 grid gap-8 border-t border-foreground/20 pt-6 md:grid-cols-[1.4fr_1fr]" aria-label="About">
        <div className="space-y-5">
          <p className="font-display text-2xl leading-snug">{startup.short_description}</p>
          {startup.problem_statement ? <div><p className="eyebrow mb-1">The problem</p><p className="text-foreground/80">{startup.problem_statement}</p></div> : null}
          {startup.product_overview ? <div><p className="eyebrow mb-1">The product</p><p className="text-foreground/80">{startup.product_overview}</p></div> : null}
        </div>
        <div>
          <p className="eyebrow mb-3">Team</p>
          {team && team.length > 0 ? (
            <ul className="space-y-3">
              {team.map((m) => (
                <li key={m.profile_id}>
                  <Link href={`/founders/${m.profile_id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={m.full_name} src={m.avatar_url} size={40} />
                    <span><span className="block text-sm font-medium">{m.full_name}</span><span className="block text-xs text-muted-foreground">{m.role_title}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No public team members yet.</p>}
        </div>
      </section>

      <section className="mt-10 border-t border-foreground/20 pt-6" aria-label="Milestones">
        <p className="eyebrow mb-4">Milestones</p>
        {milestones && milestones.length > 0 ? (
          <ol className="border-l border-border pl-5">
            {milestones.map((m) => (
              <li key={m.id} className="relative pb-5 last:pb-0">
                <span aria-hidden className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border border-foreground bg-background" />
                <p className="font-display text-xl">{m.title}</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{formatDate(m.occurred_on)} · {humanize(m.kind)}</p>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No milestones shared yet.</p>}
      </section>

      <section className="mt-10 border-t border-foreground/20 pt-6" aria-label="Product launches">
        <p className="eyebrow mb-4">Launches</p>
        {launches && launches.length > 0 ? (
          <ul className="divide-y divide-border border-y border-border">
            {launches.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-4 py-3">
                <span><span className="font-display text-xl">{l.name}</span> <span className="text-sm text-muted-foreground">{l.tagline}</span></span>
                <span className="shrink-0 font-mono text-xs tabular">▲ {l.votes_count}</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No launches yet" />}
      </section>

      {canClaim ? (
        <Card className="mt-10">
          <CardHeader><CardTitle>Part of this team?</CardTitle></CardHeader>
          <CardContent>
            <ActionForm action={claimStartup} submitLabel="Request to join" resetOnSuccess successMessage="Request sent. Our team will review it.">
              <input type="hidden" name="startup_id" value={startup.id} />
              <Field label="Tell us how you're connected to this company" htmlFor="claim-message">
                <Textarea id="claim-message" name="message" required minLength={10} />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
