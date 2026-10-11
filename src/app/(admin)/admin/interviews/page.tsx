import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Flash } from "@/components/app/flash";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Interviews" };

export default async function InterviewsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, application_id, interview_type, status, scheduled_at, meeting_link, outcome_recommendation, membership_applications(applicant_type, status, company_name, organisation_name, profile_id)")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(100);
  const rows = (interviews ?? []).map((i) => ({ ...i, app: Array.isArray(i.membership_applications) ? i.membership_applications[0] : i.membership_applications }));
  const ids = [...new Set(rows.flatMap((r) => (r.app ? [r.app.profile_id] : [])))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return (
    <>
      <PageHeader title="Interview queue" description="Written answers arrive with the application. Open one to schedule a video interview or record the outcome." />
      <Flash error={error} />
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/applications/${r.application_id}`}>
                <Card className="transition-shadow hover:shadow-md"><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">{people?.find((p) => p.id === r.app?.profile_id)?.full_name ?? "Applicant"}</p>
                    <p className="text-sm text-muted-foreground">{humanize(r.app?.applicant_type ?? "")} · {r.app?.company_name ?? r.app?.organisation_name ?? "—"} · {humanize(r.interview_type)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {r.scheduled_at ? <span className="text-muted-foreground">{formatDate(r.scheduled_at, true)}</span> : null}
                    {r.outcome_recommendation ? <Badge tone={r.outcome_recommendation === "approve" ? "success" : "warning"}>{humanize(r.outcome_recommendation)}</Badge> : null}
                    <Badge>{humanize(r.status)}</Badge>
                  </div>
                </CardContent></Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No interviews yet" />}
    </>
  );
}
