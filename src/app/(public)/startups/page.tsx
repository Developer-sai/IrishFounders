import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startups/startup-card";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Verified startups" };

type SP = { q?: string; stage?: string; industry?: string };

/** Strips PostgREST filter metacharacters from user search text. */
const cleanSearch = (v: string) => v.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

export default async function StartupsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("startups")
    .select("id, name, slug, logo_url, industry, stage, short_description, location")
    .eq("is_verified", true)
    .eq("is_demo", false)
    .order("verified_at", { ascending: false })
    .limit(60);

  const q = sp.q ? cleanSearch(sp.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
  if (sp.stage && (STARTUP_STAGES as readonly string[]).includes(sp.stage)) {
    query = query.eq("stage", sp.stage as (typeof STARTUP_STAGES)[number]);
  }
  if (sp.industry) query = query.ilike("industry", cleanSearch(sp.industry));

  const { data: startups } = await query;

  return (
    <div className="py-12">
      <PageHeader title="Verified startups" description="Every company here has been reviewed by our team." />
      <form className="mb-8 grid gap-3 md:grid-cols-[1fr_200px_auto]" role="search">
        <Input name="q" placeholder="Search startups" defaultValue={sp.q ?? ""} aria-label="Search startups" />
        <Select name="stage" defaultValue={sp.stage ?? ""} aria-label="Stage">
          <option value="">All stages</option>
          {STARTUP_STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </Select>
        <Button type="submit">Filter</Button>
      </form>
      {startups && startups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => <StartupCard key={s.id} startup={s} />)}
        </div>
      ) : (
        <EmptyState
          title="No startups match yet"
          description="Verified startups appear here once their founders are approved."
        />
      )}
    </div>
  );
}
