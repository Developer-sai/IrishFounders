import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin overview" };

type Overview = Record<string, number>;

const TILES: [string, string, string][] = [
  ["accounts", "Registered accounts", "/admin/users"],
  ["pending_applications", "Pending applications", "/admin/applications"],
  ["approved_founders", "Approved founders", "/admin/users"],
  ["verified_startups", "Verified startups", "/admin/startups"],
  ["approved_investors", "Approved investors", "/admin/users"],
  ["pending_interviews", "Pending interviews", "/admin/interviews"],
  ["open_reports", "Reported content", "/admin/moderation"],
  ["active_members", "Active members", "/admin/users"],
  ["recent_launches", "Launches (30 days)", "/launches"],
  ["pending_claims", "Company claims", "/admin/startups"],
  ["pending_opportunities", "Opportunities awaiting approval", "/admin/opportunities"],
];

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_overview");
  const o = (data ?? {}) as Overview;
  return (
    <>
      <PageHeader title="Admin overview" description="Live figures from the database." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map(([key, label, href]) => (
          <Link key={key} href={href}>
            <Card className="h-full transition-colors hover:border-foreground"><CardContent>
              <p className="text-3xl font-semibold">{o[key] ?? 0}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent></Card>
          </Link>
        ))}
      </div>
    </>
  );
}
