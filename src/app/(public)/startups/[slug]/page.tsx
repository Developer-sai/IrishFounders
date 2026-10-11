import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Textarea } from "@/components/ui/form-controls";
import { claimStartup } from "@/lib/actions/community";
import { getSession } from "@/lib/auth";
import { humanize } from "@/lib/utils";

type Params = { slug: string };

async function loadStartup(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("startups")
    .select("*")
    .eq("slug", slug)
    .eq("is_verified", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await loadStartup(slug);
  return s ? { title: s.name, description: s.short_description } : { title: "Startup not found" };
}

export default async function StartupPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const startup = await loadStartup(slug);
  if (!startup) notFound();

  const supabase = await createClient();
  const [{ data: team }, { data: launches }] = await Promise.all([
    supabase.from("public_startup_team").select("*").eq("startup_id", startup.id),
    supabase
      .from("product_launches")
      .select("id, name, slug, tagline, votes_count")
      .eq("startup_id", startup.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const session = await getSession();
  const canClaim =
    session?.role === "founder" && session.verification_status === "approved" &&
    !(team ?? []).some((m) => m.profile_id === session.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-12">
      <header className="flex flex-wrap items-center gap-4">
        {startup.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={startup.logo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-2xl font-semibold">
            {startup.name[0]}
          </span>
        )}
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            {startup.name}
            <span title="Company reviewed by Irish Founders" className="inline-flex">
              <BadgeCheck className="h-6 w-6 text-accent" aria-label="Verified startup: company reviewed" />
            </span>
          </h1>
          <p className="text-muted-foreground">{startup.location ?? "Ireland"} · Founded {startup.founded_year}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge>{startup.industry}</Badge>
        <Badge>{humanize(startup.stage)}</Badge>
        <Badge>{startup.team_size} {startup.team_size === 1 ? "person" : "people"}</Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline">
          <Globe className="h-4 w-4" aria-hidden /> Website
        </a>
        <a href={startup.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline">
          <ExternalLink className="h-4 w-4" aria-hidden /> LinkedIn
        </a>
      </div>

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{startup.short_description}</p>
          {startup.problem_statement ? (
            <div><h3 className="font-medium">Problem</h3><p className="text-muted-foreground">{startup.problem_statement}</p></div>
          ) : null}
          {startup.product_overview ? (
            <div><h3 className="font-medium">Product</h3><p className="text-muted-foreground">{startup.product_overview}</p></div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Team</CardTitle></CardHeader>
        <CardContent>
          {team && team.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {team.map((m) => (
                <li key={m.profile_id}>
                  <Link href={`/founders/${m.profile_id}`} className="flex items-center gap-3">
                    <Avatar name={m.full_name} src={m.avatar_url} />
                    <span>
                      <span className="block text-sm font-medium">{m.full_name}</span>
                      <span className="block text-xs text-muted-foreground">{m.role_title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No public team members yet.</p>
          )}
        </CardContent>
      </Card>

      {canClaim ? (
        <Card>
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

      <Card>
        <CardHeader><CardTitle>Product launches</CardTitle></CardHeader>
        <CardContent>
          {launches && launches.length > 0 ? (
            <ul className="space-y-3">
              {launches.map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span><strong>{l.name}</strong> — <span className="text-muted-foreground">{l.tagline}</span></span>
                  <span className="text-xs text-muted-foreground">{l.votes_count} supporters</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No launches yet" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
