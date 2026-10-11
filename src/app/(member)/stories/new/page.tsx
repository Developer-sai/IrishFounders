import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { createStory } from "@/lib/actions/social";

export const metadata: Metadata = { title: "Add a story" };

const KINDS = [
  ["update", "Update"], ["milestone", "Milestone"], ["hiring", "We're hiring"], ["looking_for", "Looking for…"], ["launch", "Launch"],
] as const;

export default async function NewStoryPage() {
  const session = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("startup_members").select("startups(id, name)").eq("profile_id", session.id);
  const startups = (data ?? []).flatMap((m) => (Array.isArray(m.startups) ? m.startups : m.startups ? [m.startups] : []));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Add a story" description="A quick update that disappears after 24 hours. Visible to verified members only." />
      <Card>
        <CardContent>
          <ActionForm action={createStory} submitLabel="Share story" buttonProps={{ variant: "accent" }}>
            <Field label="What's happening?" htmlFor="text" hint="Up to 280 characters.">
              <Textarea id="text" name="text" maxLength={280} placeholder="Closed our first pilot customer in Cork." />
            </Field>
            <Field label="Image (optional)" htmlFor="image" hint="PNG, JPEG or WebP, up to 5MB.">
              <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="kind">
                <Select id="kind" name="kind" defaultValue="update">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
              </Field>
              {startups.length ? (
                <Field label="On behalf of" htmlFor="startup_id">
                  <Select id="startup_id" name="startup_id" defaultValue="">
                    <option value="">Just me</option>
                    {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
              ) : null}
            </div>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
