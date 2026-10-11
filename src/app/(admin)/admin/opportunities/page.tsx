import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { Flash } from "@/components/app/flash";
import { reviewOpportunityRow } from "@/lib/actions/admin";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Opportunity approvals" };

export default async function AdminOpportunitiesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("opportunities").select("*").eq("status", "pending").order("created_at");
  return (
    <>
      <PageHeader title="Opportunity approvals" description="Check each source URL before approving. Never publish unverified programmes, events or deadlines." />
      <Flash error={error} />
      {data?.length ? (
        <ul className="space-y-3">
          {data.map((o) => (
            <li key={o.id}><Card><CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-3"><div><Badge className="mr-2">{humanize(o.category)}</Badge><strong>{o.title}</strong></div><span className="text-xs text-muted-foreground">{formatDate(o.created_at)}</span></div>
              <p className="text-sm text-muted-foreground">{o.description}</p>
              <a href={o.source_url} target="_blank" rel="noopener noreferrer nofollow" className="block break-all text-sm underline">{o.source_url}</a>
              <div className="flex gap-2">
                <ActionButton action={reviewOpportunityRow} hidden={{ id: o.id, approve: "true" }} label="Approve" size="sm" variant="accent" />
                <ActionButton action={reviewOpportunityRow} hidden={{ id: o.id, approve: "false" }} label="Reject" size="sm" variant="outline" />
              </div>
            </CardContent></Card></li>
          ))}
        </ul>
      ) : <EmptyState title="Nothing awaiting approval" />}
    </>
  );
}
