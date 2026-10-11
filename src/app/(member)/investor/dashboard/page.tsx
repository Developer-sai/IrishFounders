import type { Metadata } from "next";
import Link from "next/link";
import { requireInvestor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { StartupCard } from "@/components/startups/startup-card";

export const metadata: Metadata = { title: "Investor overview" };

export default async function InvestorDashboardPage() {
  const session = await requireInvestor();
  const supabase = await createClient();
  const [saved, intros, accepted, recent] = await Promise.all([
    supabase.from("saved_items").select("item_id", { count: "exact", head: true }).eq("user_id", session.id).eq("item_type", "startup"),
    supabase.from("investor_introductions").select("id", { count: "exact", head: true }).eq("investor_id", session.id).eq("status", "pending"),
    supabase.from("investor_introductions").select("id", { count: "exact", head: true }).eq("investor_id", session.id).eq("status", "accepted"),
    supabase.from("startups").select("id, name, slug, logo_url, industry, stage, short_description, location").eq("is_verified", true).eq("is_demo", false).order("verified_at", { ascending: false }).limit(3),
  ]);
  const stats = [
    ["Saved startups", saved.count ?? 0, "/investor/saved"],
    ["Pending introductions", intros.count ?? 0, "/investor/introductions"],
    ["Accepted introductions", accepted.count ?? 0, "/messages"],
  ] as const;
  return (
    <>
      <PageHeader title={`Welcome, ${session.full_name.split(" ")[0] ?? "there"}`} description="Discover verified startups and request introductions. Founders decide whether to accept." />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href}><Card className="transition-colors hover:border-foreground"><CardContent><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card></Link>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Recently verified startups</CardTitle></CardHeader>
        <CardContent>
          {recent.data?.length ? <div className="grid gap-4 md:grid-cols-3">{recent.data.map((s) => <StartupCard key={s.id} startup={s} />)}</div> : <p className="text-sm text-muted-foreground">No verified startups yet.</p>}
        </CardContent>
      </Card>
    </>
  );
}
