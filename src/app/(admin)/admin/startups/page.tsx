import type { Metadata } from "next";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { Flash } from "@/components/app/flash";
import { resolveClaimRow, verifyStartupRow } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Startups & claims" };

export default async function AdminStartupsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireSuperAdmin();
  const supabase = await createClient();
  const [{ data: startups }, { data: claims }] = await Promise.all([
    supabase.from("startups").select("id, name, slug, normalized_domain, linkedin_url, is_verified, is_demo, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("startup_claims").select("id, claimant_id, message, startups(name, slug)").eq("status", "pending").order("created_at"),
  ]);
  const ids = [...new Set((claims ?? []).map((c) => c.claimant_id))];
  const { data: people } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };

  return (
    <>
      <PageHeader title="Startups & ownership claims" description="Verify companies and resolve duplicate or disputed ownership." />
      <Flash error={error} />

      <Card className="mb-8">
        <CardHeader><CardTitle>Pending claims</CardTitle></CardHeader>
        <CardContent>
          {claims?.length ? (
            <ul className="space-y-3">
              {claims.map((c) => {
                const st = Array.isArray(c.startups) ? c.startups[0] : c.startups;
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p><strong>{people?.find((p) => p.id === c.claimant_id)?.full_name ?? "Member"}</strong> wants to join <Link href={`/startups/${st?.slug}`} className="underline">{st?.name}</Link></p>
                      <p className="text-muted-foreground">{c.message}</p>
                    </div>
                    <span className="flex gap-2">
                      <ActionButton action={resolveClaimRow} hidden={{ id: c.id, approve: "true" }} label="Approve" size="sm" variant="accent" />
                      <ActionButton action={resolveClaimRow} hidden={{ id: c.id, approve: "false" }} label="Decline" size="sm" variant="outline" />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No pending claims.</p>}
        </CardContent>
      </Card>

      {startups?.length ? (
        <ul className="space-y-2">
          {startups.map((s) => (
            <li key={s.id}><Card><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <Link href={s.is_verified ? `/startups/${s.slug}` : "#"} className="font-medium">{s.name}</Link>{s.is_demo ? <Badge tone="warning" className="ml-2">DEMO</Badge> : null}
                <p className="text-xs text-muted-foreground">{s.normalized_domain}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.is_verified ? "success" : "warning"}>{s.is_verified ? "Verified" : "Unverified"}</Badge>
                <ActionButton action={verifyStartupRow} hidden={{ id: s.id, verify: String(!s.is_verified) }} label={s.is_verified ? "Revoke" : "Verify"} size="sm" variant="outline" />
              </div>
            </CardContent></Card></li>
          ))}
        </ul>
      ) : <EmptyState title="No startups yet" />}
    </>
  );
}
