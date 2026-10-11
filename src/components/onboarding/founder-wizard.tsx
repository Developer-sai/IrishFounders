"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkCompany, submitFounderApplication } from "@/lib/actions/application";
import {
  INTERVIEW_QUESTIONS_FOUNDER, STARTUP_STAGES, founderApplicationSchema,
} from "@/lib/validations/application";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { humanize } from "@/lib/utils";

type Values = Record<string, string>;
type Errors = Record<string, string>;

const STEPS = ["Personal", "Company", "Verification", "Interview", "Review"] as const;

const EMPTY: Values = {
  full_name: "", linkedin_url: "", location: "", headline: "",
  company_name: "", company_website: "", company_linkedin: "", industry: "",
  stage: "prototype", founded_year: String(new Date().getFullYear()), team_size: "1", company_description: "",
  linkedin_follower_count: "", post_urls: "", relationship_to_company: "",
  ...Object.fromEntries(INTERVIEW_QUESTIONS_FOUNDER.map(([k]) => [`q_${k}`, ""])),
};

function toInput(v: Values, avatarUrl: string) {
  return {
    profile: {
      full_name: v.full_name, linkedin_url: v.linkedin_url, location: v.location,
      headline: v.headline, avatar_url: avatarUrl,
    },
    company_name: v.company_name, company_website: v.company_website, company_linkedin: v.company_linkedin,
    industry: v.industry, stage: v.stage, founded_year: v.founded_year, team_size: v.team_size,
    company_description: v.company_description, linkedin_follower_count: v.linkedin_follower_count,
    sample_post_urls: (v.post_urls ?? "").split(/\n/).map((s) => s.trim()).filter(Boolean),
    relationship_to_company: v.relationship_to_company,
    interview: Object.fromEntries(INTERVIEW_QUESTIONS_FOUNDER.map(([k]) => [k, v[`q_${k}`] ?? ""])),
  };
}

const STEP_FIELDS: Record<number, string[]> = {
  0: ["profile"],
  1: ["company_name", "company_website", "company_linkedin", "industry", "stage", "founded_year", "team_size", "company_description"],
  2: ["linkedin_follower_count", "sample_post_urls", "relationship_to_company"],
  3: ["interview"],
};

/** Maps a zod issue path onto the flat form key used by inputs. */
function flatKey(path: (string | number)[]): string {
  if (path[0] === "profile") return String(path[1]);
  if (path[0] === "interview") return `q_${path[1]}`;
  if (path[0] === "sample_post_urls") return "post_urls";
  return String(path[0]);
}

export function FounderWizard({ userId, defaultName }: { userId: string; defaultName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ ...EMPTY, full_name: defaultName });
  const [errors, setErrors] = useState<Errors>({});
  const [avatarUrl, setAvatarUrl] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  function validate(forStep: number): boolean {
    const result = founderApplicationSchema.safeParse(toInput(values, avatarUrl));
    const wanted = STEP_FIELDS[forStep] ?? [];
    const next: Errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        if (wanted.includes(String(issue.path[0]))) next[flatKey(issue.path)] ??= issue.message;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function upload(bucket: "avatars" | "verification-evidence", file: File): Promise<string | null> {
    if (file.size > 10 * 1024 * 1024) { setUploadMsg("File is too large (max 10MB)."); return null; }
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) { setUploadMsg("Upload failed. Check the file type and size."); return null; }
    setUploadMsg(null);
    return path;
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = await upload("avatars", file);
    if (path) setAvatarUrl(createClient().storage.from("avatars").getPublicUrl(path).data.publicUrl);
  }

  async function onEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    const paths: string[] = [];
    for (const f of files) {
      const p = await upload("verification-evidence", f);
      if (p) paths.push(p);
    }
    setEvidence((prev) => [...prev, ...paths]);
  }

  async function onCompanyBlur() {
    const website = values.company_website ?? "";
    if (!website) return;
    const res = await checkCompany(website, values.company_linkedin ?? "");
    setDuplicate(res?.startup ? res.startup.name : null);
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitFounderApplication(toInput(values, avatarUrl), evidence);
      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          const mapped: Errors = {};
          for (const [path, msgs] of Object.entries(result.fieldErrors)) {
            mapped[flatKey(path.split("."))] = msgs[0]!;
          }
          setErrors(mapped);
        }
        return;
      }
      router.push("/application/status");
      router.refresh();
    });
  }

  const f = (k: string) => ({ id: k, value: values[k] ?? "", onChange: set(k), "aria-invalid": !!errors[k] });

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-2 text-xs" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}
            className={`rounded-sm border border-border px-3 py-1 ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-verified/15 text-verified" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="space-y-4">
        {step === 0 && (
          <>
            <Field label="Full name" htmlFor="full_name" error={errors.full_name}><Input {...f("full_name")} autoComplete="name" /></Field>
            <Field label="Your LinkedIn profile URL" htmlFor="linkedin_url" error={errors.linkedin_url}><Input {...f("linkedin_url")} placeholder="linkedin.com/in/you" /></Field>
            <Field label="Location" htmlFor="location" error={errors.location}><Input {...f("location")} placeholder="Dublin, Ireland" /></Field>
            <Field label="Your role at the company" htmlFor="headline" error={errors.headline}><Input {...f("headline")} placeholder="Co-founder & CEO" /></Field>
            <Field label="Profile photo (optional)" htmlFor="avatar" hint="PNG, JPEG or WebP, up to 2MB.">
              <Input id="avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatar} />
            </Field>
            {avatarUrl ? <p className="text-xs text-verified">Photo uploaded.</p> : null}
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Company name" htmlFor="company_name" error={errors.company_name}><Input {...f("company_name")} /></Field>
            <Field label="Company website" htmlFor="company_website" error={errors.company_website}>
              <Input {...f("company_website")} placeholder="acme.ie" onBlur={onCompanyBlur} />
            </Field>
            {duplicate ? (
              <p role="status" className="rounded-md bg-amber-500/10 px-3 py-2 text-sm">
                <strong>{duplicate}</strong> already exists on Irish Founders. You can still apply. If approved, we&apos;ll
                send a request to join the existing company rather than creating a duplicate.
              </p>
            ) : null}
            <Field label="Company LinkedIn page" htmlFor="company_linkedin" error={errors.company_linkedin} hint="Must be a company page: linkedin.com/company/…">
              <Input {...f("company_linkedin")} placeholder="linkedin.com/company/acme" onBlur={onCompanyBlur} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Industry" htmlFor="industry" error={errors.industry}><Input {...f("industry")} placeholder="FinTech" /></Field>
              <Field label="Stage" htmlFor="stage" error={errors.stage}>
                <Select {...f("stage")}>{STARTUP_STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select>
              </Field>
              <Field label="Year founded" htmlFor="founded_year" error={errors.founded_year}><Input {...f("founded_year")} type="number" /></Field>
              <Field label="Team size" htmlFor="team_size" error={errors.team_size}><Input {...f("team_size")} type="number" min={1} /></Field>
            </div>
            <Field label="Short description" htmlFor="company_description" error={errors.company_description} hint="Up to 500 characters.">
              <Textarea {...f("company_description")} maxLength={500} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted-foreground">
              We review these manually. We do not scrape LinkedIn, and we will not claim these numbers are independently verified.
            </p>
            <Field label="Company LinkedIn follower count" htmlFor="linkedin_follower_count" error={errors.linkedin_follower_count} hint="Minimum 50.">
              <Input {...f("linkedin_follower_count")} type="number" min={0} />
            </Field>
            <Field label="Links to company LinkedIn posts (one per line)" htmlFor="post_urls" error={errors.post_urls} hint="At least two recent posts.">
              <Textarea {...f("post_urls")} placeholder={"https://linkedin.com/posts/…\nhttps://linkedin.com/posts/…"} />
            </Field>
            <Field label="Your relationship to the company" htmlFor="relationship_to_company" error={errors.relationship_to_company}>
              <Textarea {...f("relationship_to_company")} placeholder="Founder and CEO since 2023…" />
            </Field>
            <Field label="Supporting documents (optional)" htmlFor="evidence" hint="PDF, PNG or JPEG. Stored privately; only you and our reviewers can see them. Do not upload passports or ID numbers.">
              <Input id="evidence" type="file" multiple accept="application/pdf,image/png,image/jpeg" onChange={onEvidence} />
            </Field>
            {evidence.length ? <p className="text-xs text-verified">{evidence.length} file(s) uploaded.</p> : null}
            {uploadMsg ? <p role="alert" className="text-xs text-destructive">{uploadMsg}</p> : null}
          </>
        )}

        {step === 3 && (
          <>
            {INTERVIEW_QUESTIONS_FOUNDER.map(([k, q]) => (
              <Field key={k} label={q} htmlFor={`q_${k}`} error={errors[`q_${k}`]}>
                <Textarea {...f(`q_${k}`)} maxLength={2000} />
              </Field>
            ))}
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p>Review your details, then submit. You can track progress on your application status page.</p>
            <dl className="grid gap-2 rounded-md border border-border bg-card p-4 sm:grid-cols-2">
              {[
                ["Name", values.full_name], ["Company", values.company_name], ["Website", values.company_website],
                ["LinkedIn", values.company_linkedin], ["Followers", values.linkedin_follower_count],
                ["Posts provided", String(toInput(values, avatarUrl).sample_post_urls.length)],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>
              ))}
            </dl>
            {submitError ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">{submitError}</p> : null}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0 || pending}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button variant="accent" onClick={submit} disabled={pending} aria-busy={pending}>
            {pending ? "Submitting…" : "Submit application"}
          </Button>
        )}
      </div>
    </div>
  );
}
