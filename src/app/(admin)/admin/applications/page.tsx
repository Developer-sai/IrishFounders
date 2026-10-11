import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

const FILTERS: [string, string[]][] = [
  ["pending", ["submitted", "under_review"]],
  ["needs_info", ["info_required"]],
  ["interview", ["interview_pending", "interview_completed"]],
  ["approved", ["approved"]],
  ["rejected", ["rejected", "suspended"]],
];
type Status = "submitted" | "under_review" | "info_required" | "interview_pending" | "interview_completed" | "approved" | "rejected" | "suspended";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<{ filter?: string; type?: string; error?: string }> }) {
  const sp = await searchParams;
  await requireSuperAdmin();
  const supabase = await createClient();
  const active = FILTERS.find(([k]) => k === sp.filter) ?? FILTERS[0]!;

  let q = supabase
    .from("membership_applications")
    .select("id, profile_id, applicant_type, status, company_name, organisation_name, normalized_domain, submitted_at")
    .in("status", active[1] as Status[])
    .order("submitted_at", { ascending: true })
    .limit(100);
  if (sp.type === "founder" || sp.type === "investor" || sp.type === "partner") q = q.eq("applicant_type", sp.type);
  const { data: apps } = await q;

  const ids = [...new Set((apps ?? []).map((a) => a.profile_id))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return (
    <>
      <PageHeader title="Membership applications" description="Oldest first. Open an application to review evidence and decide." />
      <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map(([k]) => (
          <Link key={k} href={`/admin/applications?filter=${k}${sp.type ? `&type=${sp.type}` : ""}`} className={`rounded-sm border border-border px-3 py-1 ${active[0] === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{humanize(k)}</Link>
        ))}
        <span className="mx-2 text-muted-foreground">|</span>
        {["founder", "investor", "partner"].map((t) => (
          <Link key={t} href={`/admin/applications?filter=${active[0]}&type=${t}`} className={`rounded-sm border border-border px-3 py-1 ${sp.type === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{humanize(t)}s</Link>
        ))}
      </nav>
      {apps?.length ? (
        <ul className="space-y-2">
          {apps.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/applications/${a.id}`}>
                <Card className="transition-colors hover:border-foreground"><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{people?.find((p) => p.id === a.profile_id)?.full_name ?? "Applicant"}</p>
                    <p className="text-sm text-muted-foreground">{humanize(a.applicant_type)} · {a.company_name ?? a.organisation_name ?? "—"}{a.normalized_domain ? ` · ${a.normalized_domain}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm"><span className="text-muted-foreground">{formatDate(a.submitted_at)}</span><Badge>{humanize(a.status)}</Badge></div>
                </CardContent></Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Nothing in this queue" />}
    </>
  );
}
