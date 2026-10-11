"use client";

import { useActionState } from "react";
import { SubmitButton, fieldError, type FormAction } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { INVESTOR_CATEGORIES, STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";

type Kind = "investor" | "partner";

function Shared({ state, defaultName }: { state: Parameters<typeof fieldError>[0]; defaultName: string }) {
  const e = (n: string) => fieldError(state, n);
  return (
    <>
      <Field label="Full name" htmlFor="full_name" error={e("profile.full_name")}><Input id="full_name" name="full_name" defaultValue={defaultName} required /></Field>
      <Field label="LinkedIn profile URL" htmlFor="linkedin_url" error={e("profile.linkedin_url")}><Input id="linkedin_url" name="linkedin_url" placeholder="linkedin.com/in/you" required /></Field>
      <Field label="Location" htmlFor="location" error={e("profile.location")}><Input id="location" name="location" required /></Field>
      <Field label="Your role / title" htmlFor="headline" error={e("profile.headline")}><Input id="headline" name="headline" required /></Field>
    </>
  );
}

function Interview({ state, questions }: { state: Parameters<typeof fieldError>[0]; questions: readonly (readonly [string, string])[] }) {
  return (
    <>
      <h2 className="pt-2 text-lg font-semibold">Short interview</h2>
      {questions.map(([k, q]) => (
        <Field key={k} label={q} htmlFor={`q_${k}`} error={fieldError(state, `interview.${k}`)}>
          <Textarea id={`q_${k}`} name={`q_${k}`} maxLength={2000} required />
        </Field>
      ))}
    </>
  );
}

export function SimpleApplicationForm({
  kind, action, defaultName, questions,
}: {
  kind: Kind; action: FormAction; defaultName: string; questions: readonly (readonly [string, string])[];
}) {
  const [state, formAction] = useActionState(action, null);
  const e = (n: string) => fieldError(state, n);

  return (
    <form action={formAction} className="space-y-4">
      <Shared state={state} defaultName={defaultName} />

      {kind === "investor" ? (
        <>
          <Field label="Investor category" htmlFor="investor_category" error={e("investor.investor_category")}>
            <Select id="investor_category" name="investor_category" required defaultValue="">
              <option value="" disabled>Select…</option>
              {INVESTOR_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
            </Select>
          </Field>
          <Field label="Organisation name (if applicable)" htmlFor="organisation_name"><Input id="organisation_name" name="organisation_name" /></Field>
          <Field label="Organisation website" htmlFor="organisation_website" error={e("organisation_website")}><Input id="organisation_website" name="organisation_website" /></Field>
          <Field label="Professional background" htmlFor="professional_background" error={e("investor.professional_background")}><Textarea id="professional_background" name="professional_background" required /></Field>
          <Field label="Investment sectors (comma separated)" htmlFor="investment_sectors" error={e("investor.investment_sectors")}><Input id="investment_sectors" name="investment_sectors" placeholder="FinTech, HealthTech" required /></Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Preferred startup stages</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {STARTUP_STAGES.map((s) => (
                <label key={s} className="flex items-center gap-2"><input type="checkbox" name="preferred_stages" value={s} /> {humanize(s)}</label>
              ))}
            </div>
            {e("investor.preferred_stages") ? <p role="alert" className="mt-1 text-xs text-destructive">{e("investor.preferred_stages")}</p> : null}
          </fieldset>
          <Field label="Geographic preferences (comma separated)" htmlFor="geographic_preferences"><Input id="geographic_preferences" name="geographic_preferences" placeholder="Ireland, UK" /></Field>
          <Field label="Public portfolio or professional references (one per line)" htmlFor="public_portfolio_links" error={e("investor.public_portfolio_links")}><Textarea id="public_portfolio_links" name="public_portfolio_links" /></Field>
          <Interview state={state} questions={questions} />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="disclaimer_accepted" className="mt-1" required />
            <span>I understand Irish Founders facilitates networking and introductions only. It does not provide financial or investment advice, and a verified badge is not a guarantee of financial capacity or commitment.</span>
          </label>
          {e("investor.disclaimer_accepted") ? <p role="alert" className="text-xs text-destructive">{e("investor.disclaimer_accepted")}</p> : null}
        </>
      ) : (
        <>
          <Field label="Organisation name" htmlFor="organisation_name" error={e("organisation_name")}><Input id="organisation_name" name="organisation_name" required /></Field>
          <Field label="Organisation website" htmlFor="organisation_website" error={e("organisation_website")}><Input id="organisation_website" name="organisation_website" required /></Field>
          <Field label="Organisation type" htmlFor="organisation_type" error={e("partner.organisation_type")}><Input id="organisation_type" name="organisation_type" placeholder="Accelerator, university, community…" required /></Field>
          <Interview state={state} questions={questions} />
        </>
      )}

      {state && !state.ok ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton variant="accent" pendingLabel="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
