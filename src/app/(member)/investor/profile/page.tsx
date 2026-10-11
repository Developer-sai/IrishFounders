import type { Metadata } from "next";
import { requireInvestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Investor profile" };

export default async function InvestorProfilePage() {
  const session = await requireInvestor();
  const supabase = await createClient();
  const { data: p } = await supabase.from("investor_profiles").select("*").eq("profile_id", session.id).maybeSingle();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Investor profile" description="Verified Investor: identity and background reviewed. Not a guarantee of financial capacity or commitment." />
      <Card>
        <CardHeader><CardTitle>{session.full_name}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          {p ? (
            <>
              <p><span className="text-muted-foreground">Category:</span> {humanize(p.investor_category)}{p.organisation_name ? ` · ${p.organisation_name}` : ""}</p>
              <p className="whitespace-pre-wrap">{p.professional_background}</p>
              <div className="flex flex-wrap gap-2">{p.investment_sectors.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              <p className="text-muted-foreground">Stages: {p.preferred_stages.map(humanize).join(", ") || "Any"} · Regions: {p.geographic_preferences.join(", ") || "Any"}</p>
            </>
          ) : <p className="text-muted-foreground">No investor details on file.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
