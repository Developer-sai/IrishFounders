import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StartupCard } from "@/components/startups/startup-card";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";
import { RegisterGrid, type RegisterRow } from "@/components/landing/register-grid";

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

  const filtered = !!q || !!sp.stage || !!sp.industry;
  const [{ data: startups }, { data: register }] = await Promise.all([
    query,
    filtered ? Promise.resolve({ data: null }) : supabase.rpc("public_register", { p_limit: 120 }),
  ]);
  const inReview = ((register ?? []) as RegisterRow[]).filter((r) => r.kind === "pending");

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

      {inReview.length > 0 ? (
        <section className="mt-16" aria-labelledby="in-review">
          <p className="eyebrow">Not verified yet</p>
          <h2 id="in-review" className="display mt-2 text-3xl sm:text-4xl">In review ({inReview.length})</h2>
          <p className="mb-6 mt-2 max-w-xl text-sm text-muted-foreground">
            These founders have applied and chose to be listed while we check their company. They are not verified until a person has reviewed them.
          </p>
          <RegisterGrid rows={inReview} />
        </section>
      ) : null}
    </div>
  );
}
