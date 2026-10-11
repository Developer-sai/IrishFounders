import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { createLaunch } from "@/lib/actions/community";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Launch a product" };

export default async function NewLaunchPage() {
  const session = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("startup_members").select("startups(id, name, is_verified)").eq("profile_id", session.id);
  const startups = (data ?? []).flatMap((m) => (Array.isArray(m.startups) ? m.startups : m.startups ? [m.startups] : []));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Launch a product" description="Share a real product with the community and ask for feedback." />
      {startups.length === 0 || session.role !== "founder" ? (
        <EmptyState title="You need a startup first" description="Only approved founders with a company profile can launch products." action={<Link href="/dashboard/startup" className="text-sm underline">Set up my startup</Link>} />
      ) : (
        <Card><CardContent>
          <ActionForm action={createLaunch} submitLabel="Publish launch" resetOnSuccess successMessage="Launched! It's now live on the launch board." buttonProps={{ variant: "accent" }}>
            <Field label="Startup" htmlFor="startup_id"><Select id="startup_id" name="startup_id">{startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="Product name" htmlFor="name"><Input id="name" name="name" required maxLength={80} /></Field>
            <Field label="Tagline" htmlFor="tagline"><Input id="tagline" name="tagline" required maxLength={140} /></Field>
            <Field label="Description" htmlFor="description"><Textarea id="description" name="description" required minLength={10} maxLength={3000} /></Field>
            <Field label="Website" htmlFor="website_url"><Input id="website_url" name="website_url" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="category"><Input id="category" name="category" required placeholder="Developer tools" /></Field>
              <Field label="Stage" htmlFor="stage"><Select id="stage" name="stage" defaultValue="mvp">{STARTUP_STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</Select></Field>
            </div>
            <Field label="What feedback would help? (optional)" htmlFor="feedback_requested"><Textarea id="feedback_requested" name="feedback_requested" maxLength={500} /></Field>
          </ActionForm>
        </CardContent></Card>
      )}
    </div>
  );
}
