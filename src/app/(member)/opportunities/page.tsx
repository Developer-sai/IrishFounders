import type { Metadata } from "next";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { createOpportunity } from "@/lib/actions/community";
import { OPPORTUNITY_CATEGORIES } from "@/lib/constants";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();
  let q = supabase.from("opportunities").select("*").eq("status", "approved").order("starts_at", { ascending: true, nullsFirst: false }).limit(50);
  if (category && (OPPORTUNITY_CATEGORIES as readonly string[]).includes(category)) q = q.eq("category", category);
  const { data: items } = await q;
  const canSubmit = session.role === "ecosystem_partner" || session.role === "super_admin" || session.role === "moderator";

  return (
    <>
      <PageHeader title="Opportunities" description="Events, programmes, grants and more. Every listing links to its official source and is approved before publication." />
      {canSubmit ? (
        <Card className="mb-8">
          <CardHeader><CardTitle>Submit an opportunity</CardTitle></CardHeader>
          <CardContent>
            <ActionForm action={createOpportunity} submitLabel="Submit for approval" resetOnSuccess successMessage="Submitted. It will appear once approved.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category" htmlFor="op-cat"><Select id="op-cat" name="category">{OPPORTUNITY_CATEGORIES.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</Select></Field>
                <Field label="Title" htmlFor="op-title"><Input id="op-title" name="title" required /></Field>
                <Field label="Official source URL" htmlFor="op-url"><Input id="op-url" name="source_url" required /></Field>
                <Field label="Location" htmlFor="op-loc"><Input id="op-loc" name="location" /></Field>
                <Field label="Starts" htmlFor="op-start"><Input id="op-start" name="starts_at" type="datetime-local" /></Field>
                <Field label="Expires / deadline" htmlFor="op-exp"><Input id="op-exp" name="expires_at" type="datetime-local" /></Field>
              </div>
              <Field label="Description" htmlFor="op-desc"><Textarea id="op-desc" name="description" required minLength={10} /></Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}
      {items?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((o) => (
            <li key={o.id}>
              <Card><CardContent className="space-y-2">
                <Badge>{humanize(o.category)}</Badge>
                <h2 className="font-semibold">{o.title}</h2>
                <p className="text-sm text-muted-foreground">{o.description}</p>
                <p className="text-xs text-muted-foreground">{o.location ?? "Worldwide"} · {o.starts_at ? `Starts ${formatDate(o.starts_at)}` : "Ongoing"}{o.expires_at ? ` · Until ${formatDate(o.expires_at)}` : ""}</p>
                <a href={o.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm underline">Official source</a>
              </CardContent></Card>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="No opportunities listed yet" description="Approved ecosystem partners publish programmes and events here. We never invent listings." />}
    </>
  );
}
