import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, isApproved, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { respondToInfoRequest } from "@/lib/actions/application";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Application status" };

const TRACK = [
  { key: "submitted", label: "Submitted", statuses: ["submitted"] },
  { key: "review", label: "Under review", statuses: ["under_review", "info_required"] },
  { key: "interview", label: "Interview", statuses: ["interview_pending", "interview_completed"] },
  { key: "approved", label: "Approved", statuses: ["approved"] },
] as const;

function activeIndex(status: string): number {
  const i = TRACK.findIndex((t) => (t.statuses as readonly string[]).includes(status));
  return i === -1 ? 0 : i;
}

export default async function ApplicationStatusPage() {
  const session = await requireUser();
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("membership_applications")
    .select("id, applicant_type, status, company_name, organisation_name, info_request, submitted_at, reviewed_at")
    .order("submitted_at", { ascending: false })
    .limit(1);
  const app = apps?.[0];

  if (isApproved(session)) {
    return (
      <>
        <PageHeader title="You're in" description="Your membership is approved." />
        <Link href={homeFor(session)} className={buttonVariants({ variant: "accent" })}>Open Irish Founders</Link>
      </>
    );
  }

  if (session.verification_status === "suspended") {
    return (
      <Card><CardContent>
        <h1 className="text-lg font-semibold">Account suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account is currently suspended. To appeal, please contact the Irish Founders team.</p>
      </CardContent></Card>
    );
  }

  if (!app) {
    return (
      <>
        <PageHeader title="Welcome" description="Choose how you'd like to join Irish Founders. Every application is reviewed by a person." />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["/onboarding/founder", "I'm a founder", "Apply with your company."],
            ["/onboarding/investor", "I'm an investor", "Angels, VCs, syndicates and family offices."],
            ["/onboarding/partner", "I'm an ecosystem partner", "Accelerators, universities, communities."],
          ].map(([href, title, body]) => (
            <Link key={href} href={href!} className="rounded-lg focus-visible:ring-2">
              <Card className="h-full transition-shadow hover:shadow-md"><CardContent>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </CardContent></Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  const rejected = app.status === "rejected";
  const idx = activeIndex(app.status);

  return (
    <>
      <PageHeader
        title="Application status"
        description={`${humanize(app.applicant_type)} application${app.company_name ? ` · ${app.company_name}` : app.organisation_name ? ` · ${app.organisation_name}` : ""}`}
        action={<Badge tone={rejected ? "danger" : app.status === "info_required" ? "warning" : "neutral"}>{humanize(app.status)}</Badge>}
      />

      {rejected ? (
        <Card><CardContent>
          <p className="font-medium">Your application was not approved at this time.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You may submit a new application if your circumstances change. If you believe this was a mistake, please contact the Irish Founders team to appeal.
          </p>
          <Link href="/onboarding/founder" className={buttonVariants({ variant: "outline", className: "mt-4" })}>Start a new application</Link>
        </CardContent></Card>
      ) : (
        <ol className="mb-8 grid gap-3 sm:grid-cols-4" aria-label="Application progress">
          {TRACK.map((t, i) => (
            <li key={t.key} aria-current={i === idx ? "step" : undefined}
              className={`rounded-lg border p-4 text-sm ${i < idx ? "border-accent/40 bg-accent/10" : i === idx ? "border-primary bg-card font-medium" : "border-border text-muted-foreground"}`}>
              <span className="block text-xs text-muted-foreground">Step {i + 1}</span>
              {t.label}
            </li>
          ))}
        </ol>
      )}

      {app.status === "info_required" ? (
        <Card className="mb-6">
          <CardHeader><CardTitle>We need a little more information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md bg-muted p-3 text-sm">{app.info_request}</p>
            <ActionForm action={respondToInfoRequest} submitLabel="Send update" successMessage="Thanks, your update has been sent.">
              <input type="hidden" name="application_id" value={app.id} />
              <Field label="Company LinkedIn followers (if changed)" htmlFor="linkedin_follower_count"><Input id="linkedin_follower_count" name="linkedin_follower_count" type="number" min={0} /></Field>
              <Field label="Additional LinkedIn post links (one per line)" htmlFor="sample_post_urls"><Textarea id="sample_post_urls" name="sample_post_urls" /></Field>
              <Field label="Relationship to the company / extra context" htmlFor="relationship_to_company"><Textarea id="relationship_to_company" name="relationship_to_company" /></Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Submitted {formatDate(app.submitted_at)}. You&apos;ll receive an email and an in-app notification when something changes.
        Until approved, you can&apos;t access the private community.
      </p>
    </>
  );
}
