import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { Flash } from "@/components/app/flash";
import { closeCollaborationRow, createCollaboration, requestConnectionRow } from "@/lib/actions/community";
import { COLLAB_CATEGORIES } from "@/lib/constants";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Collaborate" };

type SP = { category?: string; skill?: string; location?: string; error?: string };
const clean = (v: string) => v.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export default async function CollaboratePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();

  let q = supabase.from("collaboration_listings").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(40);
  if (sp.category && (COLLAB_CATEGORIES as readonly string[]).includes(sp.category)) q = q.eq("category", sp.category);
  if (sp.skill) q = q.contains("skills_needed", [clean(sp.skill)]);
  if (sp.location) q = q.ilike("location", `%${clean(sp.location)}%`);
  const { data: listings } = await q;

  const creatorIds = [...new Set((listings ?? []).map((l) => l.creator_id))];
  const { data: creators } = creatorIds.length ? await supabase.from("profiles").select("id, full_name").in("id", creatorIds) : { data: [] };

  return (
    <>
      <PageHeader title="Collaboration hub" description="Find co-founders, builders, advisers and mentors." />
      <Flash error={sp.error} />

      <Card className="mb-8">
        <CardHeader><CardTitle>Post a collaboration request</CardTitle></CardHeader>
        <CardContent>
          <ActionForm action={createCollaboration} submitLabel="Publish" resetOnSuccess successMessage="Published." buttonProps={{ variant: "accent" }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="I'm looking for" htmlFor="co-cat"><Select id="co-cat" name="category">{COLLAB_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</Select></Field>
              <Field label="Title" htmlFor="co-title"><Input id="co-title" name="title" required /></Field>
              <Field label="Skills needed (comma separated)" htmlFor="co-skills"><Input id="co-skills" name="skills_needed" placeholder="React, Postgres" /></Field>
              <Field label="Commitment" htmlFor="co-commit"><Input id="co-commit" name="commitment_type" required placeholder="Part-time, equity" /></Field>
              <Field label="Industry" htmlFor="co-ind"><Input id="co-ind" name="industry" /></Field>
              <Field label="Location" htmlFor="co-loc"><Input id="co-loc" name="location" /></Field>
            </div>
            <Field label="Description" htmlFor="co-desc"><Textarea id="co-desc" name="description" required minLength={10} /></Field>
          </ActionForm>
        </CardContent>
      </Card>

      <form className="mb-6 grid gap-3 sm:grid-cols-[200px_1fr_1fr_auto]" role="search">
        <Select name="category" defaultValue={sp.category ?? ""} aria-label="Category"><option value="">All types</option>{COLLAB_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</Select>
        <Input name="skill" placeholder="Skill" defaultValue={sp.skill ?? ""} aria-label="Skill" />
        <Input name="location" placeholder="Location" defaultValue={sp.location ?? ""} aria-label="Location" />
        <Button type="submit">Filter</Button>
      </form>

      {listings?.length ? (
        <ul className="space-y-4">
          {listings.map((l) => (
            <li key={l.id}>
              <Card><CardContent className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge className="mb-1">{humanize(l.category)}</Badge>
                    <h2 className="font-semibold">{l.title}</h2>
                    <Link href={`/founders/${l.creator_id}`} className="text-sm text-muted-foreground underline">{creators?.find((c) => c.id === l.creator_id)?.full_name ?? "Member"}</Link>
                  </div>
                  {l.creator_id === session.id
                    ? <ActionButton action={closeCollaborationRow} hidden={{ id: l.id }} label="Close listing" size="sm" variant="outline" />
                    : <ActionButton action={requestConnectionRow} hidden={{ id: l.creator_id, path: "/collaborate" }} label="Connect" size="sm" variant="outline" />}
                </div>
                <p className="text-sm">{l.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">{l.skills_needed.map((s) => <Badge key={s}>{s}</Badge>)}<span className="text-muted-foreground">{l.commitment_type}{l.location ? ` · ${l.location}` : ""}</span></div>
              </CardContent></Card>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No listings match" description="Try different filters or post the first request." />}
    </>
  );
}
