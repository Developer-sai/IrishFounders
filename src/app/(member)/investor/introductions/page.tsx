import type { Metadata } from "next";
import Link from "next/link";
import { requireInvestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Founder introductions" };

export default async function IntroductionsPage() {
  const session = await requireInvestor();
  const supabase = await createClient();
  const { data: intros } = await supabase
    .from("investor_introductions").select("id, founder_id, message, status, created_at, startups(name, slug)")
    .eq("investor_id", session.id).order("created_at", { ascending: false });
  const ids = [...new Set((intros ?? []).map((i) => i.founder_id))];
  const { data: founders } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  return (
    <>
      <PageHeader title="Founder introductions" description="Private conversations open only after the founder accepts." />
      {intros?.length ? (
        <ul className="space-y-3">
          {intros.map((i) => {
            const st = Array.isArray(i.startups) ? i.startups[0] : i.startups;
            return (
              <li key={i.id}><Card><CardContent className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{founders?.find((f) => f.id === i.founder_id)?.full_name ?? "Founder"}{st ? <> · <Link href={`/startups/${st.slug}`} className="underline">{st.name}</Link></> : null}</p>
                  <Badge tone={i.status === "accepted" ? "success" : i.status === "declined" ? "danger" : "neutral"}>{humanize(i.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{i.message}</p>
                <p className="text-xs text-muted-foreground">{formatDate(i.created_at)}{i.status === "accepted" ? <> · <Link href="/messages" className="underline">Open conversation</Link></> : null}</p>
              </CardContent></Card></li>
            );
          })}
        </ul>
      ) : <EmptyState title="No introductions yet" action={<Link href="/investor/discover" className="text-sm underline">Discover startups</Link>} />}
    </>
  );
}
