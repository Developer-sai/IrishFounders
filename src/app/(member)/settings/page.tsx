import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { updateProfile } from "@/lib/actions/community";

export const metadata: Metadata = { title: "Settings" };

const HIDEABLE = [
  ["avatar", "Profile photo"], ["bio", "Biography"], ["location", "Location"], ["linkedin", "LinkedIn link"], ["skills", "Skills"],
] as const;

export default async function SettingsPage() {
  const s = await requireMember();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and what is visible on your public founder page." />
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
