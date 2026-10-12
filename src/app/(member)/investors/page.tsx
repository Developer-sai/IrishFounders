import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Investors" };

export default async function InvestorsDirectoryPage() {
  await requireMember();
  const supabase = await createClient();
  const { data: investors } = await supabase
    .from("investor_profiles")
    .select("profile_id, investor_category, organisation_name, investment_sectors, preferred_stages, geographic_preferences")
    .limit(50);
  const ids = (investors ?? []).map((i) => i.profile_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url, headline, verification_status, role").in("id", ids).eq("role", "investor").eq("verification_status", "approved")
    : { data: [] };
  const visible = (investors ?? []).filter((i) => profiles?.some((p) => p.id === i.profile_id));

  return (
    <>
      <PageHeader title="Investors" description="Verified investors on Space of Founders, from around the world. Verification confirms identity and background, not financial capacity or investment commitment. Investors request introductions to you; you decide whether to accept." />
      {visible.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((i) => {
            const p = profiles?.find((x) => x.id === i.profile_id);
            return (
              <li key={i.profile_id}>
                <Card><CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p?.full_name ?? null} src={p?.avatar_url} />
                    <div><p className="font-medium">{p?.full_name}</p><p className="text-xs text-muted-foreground">{humanize(i.investor_category)}{i.organisation_name ? ` · ${i.organisation_name}` : ""}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">{i.investment_sectors.map((s) => <Badge key={s}>{s}</Badge>)}</div>
                  <p className="text-xs text-muted-foreground">Stages: {i.preferred_stages.map(humanize).join(", ") || "Any"} · Regions: {i.geographic_preferences.join(", ") || "Any"}</p>
                </CardContent></Card>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState title="No verified investors yet" description="Investors are manually verified before appearing here." />}
    </>
  );
}
