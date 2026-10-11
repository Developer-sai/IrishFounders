import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { applyDesignPartner, createDesignPartnerRequest, respondDesignPartnerRow } from "@/lib/actions/community";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Design partners" };

export default async function DesignPartnersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();

  const [{ data: requests }, { data: mine }, { data: myStartups }] = await Promise.all([
    supabase.from("design_partner_requests").select("*, startups(name)").eq("is_active", true).order("created_at", { ascending: false }).limit(40),
    supabase.from("design_partner_applications").select("id, request_id, applicant_id, message, status, created_at"),
    supabase.from("startup_members").select("startups(id, name)").eq("profile_id", session.id),
  ]);
  const startupOptions = (myStartups ?? []).flatMap((m) => (Array.isArray(m.startups) ? m.startups : m.startups ? [m.startups] : []));
  const applicantIds = [...new Set((mine ?? []).map((a) => a.applicant_id))];
  const { data: names } = applicantIds.length ? await supabase.from("profiles").select("id, full_name").in("id", applicantIds) : { data: [] };
  const nameOf = (id: string) => names?.find((n) => n.id === id)?.full_name ?? "Member";

  return (
    <>
      <PageHeader title="Design partners" description="Find your first genuine product testers — or become one." />
      <Flash error={error} />

      {session.role === "founder" && startupOptions.length ? (
        <Card className="mb-8">
          <CardHeader><CardTitle>Request design partners</CardTitle></CardHeader>
          <CardContent>
            <ActionForm action={createDesignPartnerRequest} submitLabel="Publish request" resetOnSuccess successMessage="Request published." buttonProps={{ variant: "accent" }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Startup" htmlFor="dp-startup"><Select id="dp-startup" name="startup_id">{startupOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
                <Field label="Title" htmlFor="dp-title"><Input id="dp-title" name="title" required /></Field>
                <Field label="Product" htmlFor="dp-product"><Input id="dp-product" name="product_name" /></Field>
                <Field label="Target user" htmlFor="dp-target"><Input id="dp-target" name="target_user" required /></Field>
                <Field label="Type of feedback" htmlFor="dp-fb"><Input id="dp-fb" name="feedback_type" required placeholder="Usability testing, interviews…" /></Field>
                <Field label="Partners needed" htmlFor="dp-n"><Input id="dp-n" name="partners_needed" type="number" min={1} max={50} defaultValue={3} required /></Field>
                <Field label="Expected commitment" htmlFor="dp-commit"><Input id="dp-commit" name="expected_commitment" required placeholder="2 calls over 4 weeks" /></Field>
                <Field label="Mode" htmlFor="dp-mode"><Select id="dp-mode" name="work_mode" defaultValue="remote"><option value="remote">Remote</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option></Select></Field>
                <Field label="Application deadline" htmlFor="dp-deadline"><Input id="dp-deadline" name="deadline" type="date" /></Field>
              </div>
              <Field label="Problem being solved" htmlFor="dp-problem"><Textarea id="dp-problem" name="problem_statement" required minLength={10} /></Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}

      {requests?.length ? (
        <ul className="space-y-4">
          {requests.map((r) => {
            const st = Array.isArray(r.startups) ? r.startups[0] : r.startups;
            const apps = (mine ?? []).filter((a) => a.request_id === r.id);
            const mineApp = apps.find((a) => a.applicant_id === session.id);
            const isOwner = r.founder_id === session.id;
            return (
              <li key={r.id}>
                <Card><CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h2 className="font-semibold">{r.title}</h2><p className="text-sm text-muted-foreground">{st?.name} · for {r.target_user}</p></div>
                    <div className="flex gap-2"><Badge>{humanize(r.work_mode)}</Badge><Badge>{r.partners_needed} needed</Badge></div>
                  </div>
                  <p className="text-sm">{r.problem_statement}</p>
                  <p className="text-xs text-muted-foreground">Feedback: {r.feedback_type} · Commitment: {r.expected_commitment} · Deadline: {formatDate(r.deadline)}</p>

                  {isOwner ? (
                    <div className="space-y-2 border-t border-border pt-3">
                      <p className="text-sm font-medium">Interested members ({apps.length})</p>
                      {apps.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span><strong>{nameOf(a.applicant_id)}</strong>: {a.message}</span>
                          {a.status === "pending" ? (
                            <span className="flex gap-2">
                              <ActionButton action={respondDesignPartnerRow} hidden={{ id: a.id, accept: "true" }} label="Accept" size="sm" variant="accent" />
                              <ActionButton action={respondDesignPartnerRow} hidden={{ id: a.id, accept: "false" }} label="Decline" size="sm" variant="outline" />
                            </span>
                          ) : <Badge>{humanize(a.status)}</Badge>}
                        </div>
                      ))}
                    </div>
                  ) : mineApp ? (
                    <Badge tone={mineApp.status === "accepted" ? "success" : "neutral"}>Your interest: {humanize(mineApp.status)}</Badge>
                  ) : (
                    <ActionForm action={applyDesignPartner} submitLabel="I'm interested" resetOnSuccess buttonProps={{ size: "sm", variant: "outline" }} className="flex gap-2 border-t border-border pt-3">
                      <input type="hidden" name="request_id" value={r.id} />
                      <Input name="message" placeholder="Why are you a good fit?" aria-label="Message" required minLength={5} />
                    </ActionForm>
                  )}
                </CardContent></Card>
              </li>
            );
          })}
        </ul>
      ) : <EmptyState title="No open requests" description="Founders post requests for design partners here." />}
    </>
  );
}
