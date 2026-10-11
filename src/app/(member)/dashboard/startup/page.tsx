import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { createStartup, updateStartup } from "@/lib/actions/community";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "My startup" };

export default async function MyStartupPage() {
  const session = await requireMember();
  const supabase = await createClient();
  const [{ data: memberships }, { data: claims }] = await Promise.all([
    supabase.from("startup_members").select("is_admin, role_title, startups(*)").eq("profile_id", session.id),
    supabase.from("startup_claims").select("id, status, startups(name)").eq("claimant_id", session.id).order("created_at", { ascending: false }),
  ]);
  const mine = (memberships ?? []).flatMap((m) => {
    const s = Array.isArray(m.startups) ? m.startups[0] : m.startups;
    return s ? [{ ...s, is_admin: m.is_admin, role_title: m.role_title }] : [];
  });
  const canCreate = session.role === "founder";

  return (
    <>
      <PageHeader title="My startup" description="Manage your company profile and team." action={mine.length ? <Link href="/launches/new" className="text-sm underline">Launch a product →</Link> : undefined} />

      {mine.map((s) => (
        <Card key={s.id} className="mb-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle><Link href={`/startups/${s.slug}`} className="underline">{s.name}</Link></CardTitle>
            <Badge tone={s.is_verified ? "success" : "warning"}>{s.is_verified ? "Verified" : "Awaiting verification"}</Badge>
          </CardHeader>
          <CardContent>
            {s.is_admin ? (
              <ActionForm action={updateStartup} submitLabel="Save changes" successMessage="Saved.">
                <input type="hidden" name="id" value={s.id} />
                <Field label="Short description" htmlFor={`d-${s.id}`}><Textarea id={`d-${s.id}`} name="short_description" defaultValue={s.short_description} maxLength={500} required /></Field>
                <Field label="Problem being solved" htmlFor={`p-${s.id}`}><Textarea id={`p-${s.id}`} name="problem_statement" defaultValue={s.problem_statement ?? ""} /></Field>
                <Field label="Product overview" htmlFor={`o-${s.id}`}><Textarea id={`o-${s.id}`} name="product_overview" defaultValue={s.product_overview ?? ""} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Location" htmlFor={`l-${s.id}`}><Input id={`l-${s.id}`} name="location" defaultValue={s.location ?? ""} /></Field>
                  <Field label="Team size" htmlFor={`t-${s.id}`}><Input id={`t-${s.id}`} name="team_size" type="number" min={1} defaultValue={s.team_size} /></Field>
                </div>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted-foreground">You are a team member ({s.role_title}). Only company administrators can edit this profile.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {claims?.length ? (
        <Card className="mb-6"><CardHeader><CardTitle>My company claims</CardTitle></CardHeader><CardContent>
          <ul className="space-y-1 text-sm">
            {claims.map((c) => {
              const s = Array.isArray(c.startups) ? c.startups[0] : c.startups;
              return <li key={c.id}>{s?.name ?? "Company"} — <Badge>{humanize(c.status)}</Badge></li>;
            })}
          </ul>
        </CardContent></Card>
      ) : null}

      {canCreate ? (
        <Card>
          <CardHeader><CardTitle>Register another company</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">New companies are checked for duplicates and reviewed by our team before they receive a verified badge.</p>
            <ActionForm action={createStartup} submitLabel="Create company" resetOnSuccess successMessage="Created. It will appear publicly once verified.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name" htmlFor="c-name"><Input id="c-name" name="name" required /></Field>
                <Field label="Website" htmlFor="c-web"><Input id="c-web" name="website_url" required /></Field>
                <Field label="Company LinkedIn page" htmlFor="c-li"><Input id="c-li" name="linkedin_url" placeholder="linkedin.com/company/…" required /></Field>
                <Field label="Industry" htmlFor="c-ind"><Input id="c-ind" name="industry" required /></Field>
                <Field label="Stage" htmlFor="c-stage"><Select id="c-stage" name="stage" defaultValue="prototype">{STARTUP_STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select></Field>
                <Field label="Location" htmlFor="c-loc"><Input id="c-loc" name="location" /></Field>
                <Field label="Year founded" htmlFor="c-year"><Input id="c-year" name="founded_year" type="number" defaultValue={new Date().getFullYear()} required /></Field>
                <Field label="Team size" htmlFor="c-team"><Input id="c-team" name="team_size" type="number" min={1} defaultValue={1} required /></Field>
              </div>
              <Field label="Short description" htmlFor="c-desc"><Textarea id="c-desc" name="short_description" maxLength={500} required /></Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}

      <p className="mt-6 text-sm text-muted-foreground">
        Part of an existing company? Find it in the <Link href="/startups" className="underline">startup directory</Link> and use &quot;Request to join&quot; on its page.
      </p>
    </>
  );
}
