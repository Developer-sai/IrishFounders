import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { manageInterviewAction, reviewApplicationAction } from "@/lib/actions/admin";
import { INTERVIEW_QUESTIONS_FOUNDER, INTERVIEW_QUESTIONS_INVESTOR, INTERVIEW_QUESTIONS_PARTNER } from "@/lib/validations/application";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Review application" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReviewApplicationPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireSuperAdmin();
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();

  const { data: app } = await supabase.from("membership_applications").select("*").eq("id", id).maybeSingle();
  if (!app) notFound();

  // Values are interpolated into a PostgREST filter: allow only safe characters.
  const dom = /^[a-z0-9.-]+$/.test(app.normalized_domain ?? "") ? app.normalized_domain : null;
  const li = /^[a-z0-9./_%-]+$/.test(app.normalized_linkedin ?? "") ? app.normalized_linkedin : null;

  const [{ data: applicant }, { data: interview }, { data: evidence }, { data: emails }, dupStartups, dupApps] = await Promise.all([
    supabase.from("profiles").select("id, full_name, location, headline, linkedin_url").eq("id", app.profile_id).maybeSingle(),
    supabase.from("interviews").select("*").eq("application_id", id).maybeSingle(),
    supabase.from("verification_evidence").select("id, storage_path, created_at").eq("application_id", id),
    supabase.rpc("admin_profile_emails", { p_ids: [app.profile_id] }),
    dom
      ? supabase.from("startups").select("id, name, slug").or(`normalized_domain.eq.${dom},normalized_linkedin.eq.${li ?? "-"}`)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    dom
      ? supabase.from("membership_applications").select("id, status, profile_id").eq("normalized_domain", dom).neq("id", id)
      : Promise.resolve({ data: [] as { id: string; status: string; profile_id: string }[] }),
  ]);

  // Evidence lives in a private bucket: short-lived signed URLs, generated per request for admins only.
  const signed = await Promise.all(
    (evidence ?? []).map(async (e) => {
      const { data } = await supabase.storage.from("verification-evidence").createSignedUrl(e.storage_path, 300);
      return { ...e, url: data?.signedUrl ?? null };
    }),
  );

  const questions = app.applicant_type === "founder" ? INTERVIEW_QUESTIONS_FOUNDER
    : app.applicant_type === "investor" ? INTERVIEW_QUESTIONS_INVESTOR : INTERVIEW_QUESTIONS_PARTNER;
  const answers = (interview?.answers ?? {}) as Record<string, string>;
  const isFounder = app.applicant_type === "founder";
  const duplicates = (dupStartups.data?.length ?? 0) + (dupApps.data?.length ?? 0);
  const finalState = ["approved", "rejected"].includes(app.status);
  const link = (href: string | null) =>
    href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline break-all">{href}<ExternalLink className="h-3 w-3 shrink-0" aria-hidden /></a> : "—";

  return (
    <>
      <PageHeader
        title={applicant?.full_name ?? "Applicant"}
        description={`${humanize(app.applicant_type)} application · submitted ${formatDate(app.submitted_at)} · ${emails?.[0]?.email ?? ""}`}
        action={<Badge>{humanize(app.status)}</Badge>}
      />
      <Flash error={error} />

      {duplicates > 0 ? (
        <div role="alert" className="mb-6 flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-medium">Possible duplicate</p>
            <ul className="mt-1 space-y-1">
              {dupStartups.data?.map((s) => <li key={s.id}>Existing startup: <Link className="underline" href={`/startups/${s.slug}`}>{s.name}</Link>. Approving will create a claim instead of a new company.</li>)}
              {dupApps.data?.map((a) => <li key={a.id}>Another application with this domain: <Link className="underline" href={`/admin/applications/${a.id}`}>{humanize(a.status)}</Link></li>)}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Applicant</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{applicant?.headline} · {applicant?.location}</p>
              <p>LinkedIn: {link(applicant?.linkedin_url ?? null)}</p>
            </CardContent>
          </Card>

          {isFounder ? (
            <Card>
              <CardHeader><CardTitle>Company</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{app.company_name} <span className="font-normal text-muted-foreground">· {app.industry} · {humanize(app.stage ?? "")} · est. {app.founded_year} · {app.team_size} people</span></p>
                <p>{app.company_description}</p>
                <p>Website: {link(app.company_website)}</p>
                <p>Company LinkedIn: {link(app.company_linkedin)}</p>
                <p>Reported followers: <strong>{app.linkedin_follower_count}</strong> <span className="text-muted-foreground">(self-reported, not independently verified)</span></p>
                <div>Submitted posts:<ul className="ml-4 list-disc">{app.sample_post_urls.map((u) => <li key={u}>{link(u)}</li>)}</ul></div>
                <p>Relationship: {app.relationship_to_company}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>Organisation</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{app.organisation_name}</p>
                <p>Website: {link(app.organisation_website)}</p>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{JSON.stringify(app.applicant_details, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
            <CardContent>
              {signed.length ? (
                <ul className="space-y-1 text-sm">
                  {signed.map((e) => <li key={e.id}>{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">{e.storage_path.split("/").pop()}</a> : "Unavailable"} <span className="text-muted-foreground">· link expires in 5 minutes</span></li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Interview answers</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {questions.map(([k, q]) => (
                <div key={k}><p className="font-medium">{q}</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{answers[k] || "—"}</p></div>
              ))}
              {interview?.status === "scheduled" ? <p className="rounded-md bg-muted p-3">Video interview scheduled: {formatDate(interview.scheduled_at, true)} {interview.meeting_link ? <>· {link(interview.meeting_link)}</> : null}</p> : null}
            </CardContent>
          </Card>

          {!finalState ? (
            <Card>
              <CardHeader><CardTitle>Interview management</CardTitle></CardHeader>
              <CardContent>
                <form action={manageInterviewAction} className="space-y-3">
                  <input type="hidden" name="app_id" value={app.id} />
                  <input type="hidden" name="return_to" value={`/admin/applications/${app.id}`} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label htmlFor="scheduled_at">Video interview time</Label><input id="scheduled_at" name="scheduled_at" type="datetime-local" className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" /></div>
                    <div><Label htmlFor="meeting_link">Meeting link</Label><input id="meeting_link" name="meeting_link" type="url" placeholder="https://…" className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm" /></div>
                  </div>
                  <div><Label htmlFor="int-notes">Internal interview notes</Label><Textarea id="int-notes" name="notes" defaultValue={interview?.internal_notes ?? ""} /></div>
                  <div><Label htmlFor="recommendation">Recommendation</Label>
                    <select id="recommendation" name="recommendation" defaultValue={interview?.outcome_recommendation ?? ""} className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
                      <option value="">—</option><option value="approve">Approve</option><option value="needs_more_info">Needs more info</option><option value="reject">Reject</option>
                    </select></div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" name="action" value="schedule" variant="outline" size="sm">Schedule video interview</Button>
                    <Button type="submit" name="action" value="complete" variant="outline" size="sm">Mark interview completed</Button>
                    <Button type="submit" name="action" value="notes" variant="ghost" size="sm">Save notes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle>Verification &amp; decision</CardTitle></CardHeader>
            <CardContent>
              <form action={reviewApplicationAction} className="space-y-4">
                <input type="hidden" name="app_id" value={app.id} />
                {isFounder ? (
                  <fieldset className="space-y-2 text-sm">
                    <legend className="mb-1 font-medium">Checklist (all required to approve)</legend>
                    <label className="flex items-center gap-2"><input type="checkbox" name="check_website" defaultChecked={app.check_website} /> Company website is real and belongs to the company</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="check_followers" defaultChecked={app.check_followers} /> LinkedIn page has at least 50 genuine followers</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="check_posts" defaultChecked={app.check_posts} /> 2–3 genuine recent company posts inspected</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="check_relationship" defaultChecked={app.check_relationship} /> Applicant&apos;s link to the company is evidenced</label>
                  </fieldset>
                ) : null}
                <div><Label htmlFor="notes">Internal note (timestamped, never shown to applicant unless sent as an info request)</Label><Textarea id="notes" name="notes" /></div>
                <div><Label htmlFor="reason">Reason (required to reject or suspend)</Label><Textarea id="reason" name="reason" /></div>
                {app.internal_admin_notes ? <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{app.internal_admin_notes}</pre> : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="save" variant="outline" size="sm">Save checklist &amp; note</Button>
                  <Button type="submit" name="decision" value="under_review" variant="outline" size="sm">Mark under review</Button>
                  <Button type="submit" name="decision" value="request_info" variant="outline" size="sm">Request more info</Button>
                  <Button type="submit" name="decision" value="approve" variant="accent" size="sm">Approve</Button>
                  <Button type="submit" name="decision" value="reject" variant="destructive" size="sm">Reject</Button>
                  <Button type="submit" name="decision" value="suspend" variant="ghost" size="sm">Suspend application</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
