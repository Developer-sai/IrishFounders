import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { updateProfile } from "@/lib/actions/community";
import { updateIdentity } from "@/lib/actions/social";
import { OFFERING_LABELS, OPEN_TO_LABELS } from "@/components/ui/chip";
import { CoverImage } from "@/components/ui/cover-image";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

const HIDEABLE = [
  ["avatar", "Profile photo"], ["bio", "Biography"], ["location", "Location"], ["linkedin", "LinkedIn link"], ["skills", "Skills"],
] as const;

export default async function SettingsPage() {
  const s = await requireMember();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and what is visible on your public founder page." />
      <Card className="mb-6">
        <CardHeader><CardTitle>Public identity</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-5 h-28 overflow-hidden border border-border"><CoverImage src={s.cover_url} /></div>
          <ActionForm action={updateIdentity} submitLabel="Save identity" successMessage="Saved.">
            <Field label="Handle" htmlFor="handle" hint="Your short link: irishfounders.vercel.app/u/handle. 3-30 letters, numbers or underscores.">
              <div className="flex items-center gap-2"><span className="font-mono text-muted-foreground">@</span><Input id="handle" name="handle" defaultValue={s.handle ?? ""} maxLength={30} autoComplete="off" spellCheck={false} /></div>
            </Field>
            <Field label="Profile photo" htmlFor="avatar" hint="PNG, JPEG or WebP, up to 2MB."><Input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" /></Field>
            <Field label="Cover image" htmlFor="cover" hint="PNG, JPEG or WebP, up to 5MB. Wide images work best."><Input id="cover" name="cover" type="file" accept="image/png,image/jpeg,image/webp" /></Field>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">I&apos;m looking for</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(OPEN_TO_LABELS).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="open_to" value={k} defaultChecked={s.open_to.includes(k)} /> {label}</label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">I can offer</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(OFFERING_LABELS).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="offering" value={k} defaultChecked={s.offering.includes(k)} /> {label}</label>
                ))}
              </div>
            </fieldset>
            <p className="text-xs text-muted-foreground">These power your match suggestions in Discover and appear on your profile. <Link href={`/founders/${s.id}`} className="underline">View my profile</Link></p>
          </ActionForm>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={updateProfile} submitLabel="Save profile" successMessage="Profile saved.">
            <Field label="Full name" htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={s.full_name} required /></Field>
            <Field label="Headline" htmlFor="headline"><Input id="headline" name="headline" defaultValue={s.headline ?? ""} maxLength={160} /></Field>
            <Field label="Biography" htmlFor="bio"><Textarea id="bio" name="bio" defaultValue={s.bio ?? ""} maxLength={2000} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location" htmlFor="location"><Input id="location" name="location" defaultValue={s.location ?? ""} /></Field>
              <Field label="LinkedIn URL" htmlFor="linkedin_url"><Input id="linkedin_url" name="linkedin_url" defaultValue={s.linkedin_url ?? ""} /></Field>
            </div>
            <Field label="Skills (comma separated)" htmlFor="skills"><Input id="skills" name="skills" defaultValue={s.skills.join(", ")} /></Field>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Hide from my public profile</legend>
              <div className="flex flex-wrap gap-4 text-sm">
                {HIDEABLE.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2"><input type="checkbox" name="hidden_fields" value={key} defaultChecked={s.hidden_fields.includes(key)} /> {label}</label>
                ))}
              </div>
            </fieldset>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
