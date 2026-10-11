import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { Flash } from "@/components/app/flash";
import { respondConnectionRow, respondIntroductionRow } from "@/lib/actions/community";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await requireMember();
  if (session.role === "investor") redirect("/investor/dashboard");
  const supabase = await createClient();

  const [startups, requests, intros, posts, launches, collabs, opps] = await Promise.all([
    supabase.from("startup_members").select("role_title, startups(id, name, slug, is_verified)").eq("profile_id", session.id),
    supabase.from("connections").select("id, requester_id, created_at").eq("recipient_id", session.id).eq("status", "pending"),
    supabase.from("investor_introductions").select("id, investor_id, message, created_at").eq("founder_id", session.id).eq("status", "pending"),
    supabase.from("posts").select("id, title, content, category, created_at, author_id").eq("status", "published").order("created_at", { ascending: false }).limit(4),
    supabase.from("product_launches").select("id, name, tagline, slug").eq("status", "published").order("created_at", { ascending: false }).limit(4),
    supabase.from("collaboration_listings").select("id, title, category").eq("is_active", true).order("created_at", { ascending: false }).limit(4),
    supabase.from("opportunities").select("id, title, category, expires_at").eq("status", "approved").order("starts_at", { ascending: true, nullsFirst: false }).limit(4),
  ]);

  const peopleIds = [...new Set([...(requests.data ?? []).map((r) => r.requester_id), ...(intros.data ?? []).map((i) => i.investor_id)])];
  const { data: people } = peopleIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", peopleIds)
    : { data: [] as { id: string; full_name: string; avatar_url: string | null; headline: string | null }[] };
  const person = (id: string) => people?.find((p) => p.id === id);

  return (
    <>
      <PageHeader title={`Welcome, ${session.full_name.split(" ")[0] ?? "there"}`} description="Here's what's happening in your network." />
      <Flash error={error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>My startup</CardTitle></CardHeader>
          <CardContent>
            {startups.data && startups.data.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {startups.data.map((m, i) => {
                  const s = Array.isArray(m.startups) ? m.startups[0] : m.startups;
                  return s ? (
                    <li key={i} className="flex items-center justify-between">
                      <Link href={`/startups/${s.slug}`} className="font-medium underline">{s.name}</Link>
                      <Badge tone={s.is_verified ? "success" : "warning"}>{s.is_verified ? "Verified" : "Pending review"}</Badge>
                    </li>
                  ) : null;
                })}
              </ul>
            ) : (
              <EmptyState title="No startup yet" description="Create or claim your company profile." action={<Link href="/dashboard/startup" className="text-sm underline">Set up my startup</Link>} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Incoming requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(requests.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3">
                <Link href={`/founders/${r.requester_id}`} className="flex items-center gap-2 text-sm">
                  <Avatar name={person(r.requester_id)?.full_name ?? null} src={person(r.requester_id)?.avatar_url} size={32} />
                  <span>{person(r.requester_id)?.full_name ?? "Member"} <span className="text-muted-foreground">wants to connect</span></span>
                </Link>
                <span className="flex gap-2">
                  <ActionButton action={respondConnectionRow} label="Accept" hidden={{ id: r.id, accept: "true" }} variant="accent" size="sm" />
                  <ActionButton action={respondConnectionRow} label="Decline" hidden={{ id: r.id, accept: "false" }} variant="outline" size="sm" />
                </span>
              </div>
            ))}
            {(intros.data ?? []).map((i) => (
              <div key={i.id} className="rounded-md border border-border p-3 text-sm">
                <p><strong>{person(i.investor_id)?.full_name ?? "An investor"}</strong> requested an introduction</p>
                <p className="mt-1 text-muted-foreground">{i.message}</p>
                <span className="mt-2 flex gap-2">
                  <ActionButton action={respondIntroductionRow} label="Accept" hidden={{ id: i.id, accept: "true" }} variant="accent" size="sm" />
                  <ActionButton action={respondIntroductionRow} label="Decline" hidden={{ id: i.id, accept: "false" }} variant="outline" size="sm" />
                </span>
              </div>
            ))}
            {!requests.data?.length && !intros.data?.length ? <p className="text-sm text-muted-foreground">No pending requests.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest community updates</CardTitle></CardHeader>
          <CardContent>
            {posts.data?.length ? (
              <ul className="space-y-3 text-sm">
                {posts.data.map((p) => (
                  <li key={p.id}><Badge className="mr-2">{humanize(p.category)}</Badge>{p.title ?? p.content.slice(0, 90)}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No posts yet. <Link href="/feed" className="underline">Share the first update.</Link></p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recently launched</CardTitle></CardHeader>
          <CardContent>
            {launches.data?.length ? (
              <ul className="space-y-2 text-sm">{launches.data.map((l) => <li key={l.id}><strong>{l.name}</strong> — <span className="text-muted-foreground">{l.tagline}</span></li>)}</ul>
            ) : <p className="text-sm text-muted-foreground">No launches yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Collaboration opportunities</CardTitle></CardHeader>
          <CardContent>
            {collabs.data?.length ? (
              <ul className="space-y-2 text-sm">{collabs.data.map((c) => <li key={c.id}><Badge className="mr-2">{humanize(c.category)}</Badge>{c.title}</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground">Nothing listed yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming opportunities</CardTitle></CardHeader>
          <CardContent>
            {opps.data?.length ? (
              <ul className="space-y-2 text-sm">{opps.data.map((o) => <li key={o.id}><Badge className="mr-2">{humanize(o.category)}</Badge>{o.title}{o.expires_at ? <span className="text-muted-foreground"> · until {formatDate(o.expires_at)}</span> : null}</li>)}</ul>
            ) : <p className="text-sm text-muted-foreground">No approved opportunities yet.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
