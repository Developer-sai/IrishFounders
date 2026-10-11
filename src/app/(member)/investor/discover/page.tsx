import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireInvestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Input, Select } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { Flash } from "@/components/app/flash";
import { requestIntroduction, toggleSavedRow } from "@/lib/actions/community";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Discover startups" };
type SP = { industry?: string; stage?: string; location?: string; q?: string; error?: string };
const clean = (v: string) => v.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export default async function InvestorDiscoverPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requireInvestor();
  const supabase = await createClient();

  let q = supabase.from("startups").select("*").eq("is_verified", true).eq("is_demo", false).order("verified_at", { ascending: false }).limit(40);
  if (sp.industry) q = q.ilike("industry", `%${clean(sp.industry)}%`);
  if (sp.location) q = q.ilike("location", `%${clean(sp.location)}%`);
  if (sp.q) q = q.ilike("name", `%${clean(sp.q)}%`);
  if (sp.stage && (STARTUP_STAGES as readonly string[]).includes(sp.stage)) q = q.eq("stage", sp.stage as (typeof STARTUP_STAGES)[number]);
  const { data: startups } = await q;

  const ids = (startups ?? []).map((s) => s.id);
  const [{ data: team }, { data: saved }, { data: intros }] = await Promise.all([
    ids.length ? supabase.from("public_startup_team").select("startup_id, profile_id, full_name, is_admin").in("startup_id", ids) : Promise.resolve({ data: [] }),
    supabase.from("saved_items").select("item_id").eq("user_id", session.id).eq("item_type", "startup"),
    supabase.from("investor_introductions").select("startup_id, status").eq("investor_id", session.id),
  ]);

  return (
    <>
      <PageHeader title="Discover startups" description="Verified companies only. Introductions require the founder's explicit acceptance." />
      <Flash error={sp.error} />
      <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_160px_auto]" role="search">
        <Input name="q" placeholder="Name" defaultValue={sp.q ?? ""} aria-label="Name" />
        <Input name="industry" placeholder="Industry" defaultValue={sp.industry ?? ""} aria-label="Industry" />
        <Input name="location" placeholder="Location" defaultValue={sp.location ?? ""} aria-label="Location" />
        <Select name="stage" defaultValue={sp.stage ?? ""} aria-label="Stage"><option value="">Any stage</option>{STARTUP_STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select>
        <Button type="submit">Filter</Button>
      </form>

      {startups?.length ? (
        <ul className="space-y-4">
          {startups.map((s) => {
            const founders = (team ?? []).filter((t) => t.startup_id === s.id);
            const lead = founders.find((f) => f.is_admin) ?? founders[0];
            const isSaved = saved?.some((x) => x.item_id === s.id);
            const intro = intros?.find((i) => i.startup_id === s.id);
            return (
              <li key={s.id}>
                <Card><CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={`/startups/${s.slug}`} className="flex items-center gap-1 font-semibold hover:underline">{s.name}<BadgeCheck className="h-4 w-4 text-accent" aria-label="Verified startup" /></Link>
                      <p className="text-sm text-muted-foreground">{s.location ?? "Ireland"} · Founded {s.founded_year} · {s.team_size} people</p>
                    </div>
                    <div className="flex gap-2"><Badge>{s.industry}</Badge><Badge>{humanize(s.stage)}</Badge></div>
                  </div>
                  <p className="text-sm">{s.short_description}</p>
                  <div className="flex flex-wrap items-start gap-3 border-t border-border pt-3">
                    <ActionButton action={toggleSavedRow} hidden={{ id: s.id, type: "startup", path: "/investor/discover" }} label={isSaved ? "Saved" : "Save"} variant="outline" size="sm" />
                    {intro ? <Badge tone={intro.status === "accepted" ? "success" : "neutral"}>Introduction {intro.status}</Badge> : lead ? (
                      <details className="flex-1">
                        <summary className="cursor-pointer text-sm underline">Request introduction to {lead.full_name}</summary>
                        <ActionForm action={requestIntroduction} submitLabel="Send request" successMessage="Request sent." buttonProps={{ size: "sm", variant: "accent" }} className="mt-2 space-y-2">
                          <input type="hidden" name="founder_id" value={lead.profile_id ?? ""} />
                          <input type="hidden" name="startup_id" value={s.id} />
                          <Input name="message" placeholder="Why would you like to connect?" aria-label="Message" required minLength={10} />
                        </ActionForm>
                      </details>
                    ) : null}
                  </div>
                </CardContent></Card>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState title="No startups match" description="Verified startups appear here once founders are approved." />}
    </>
  );
}
