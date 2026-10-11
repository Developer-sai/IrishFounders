import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SessionProfile } from "@/lib/auth";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { respondConnectionRow, respondIntroductionRow } from "@/lib/actions/community";

type Db = SupabaseClient<Database>;

/** Starts all rail queries at once. Call it early and pass the promise down so it runs alongside the feed queries. */
export async function loadRailData(supabase: Db, session: SessionProfile) {
  const [posts, follows, startups, requests, intros] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", session.id),
    supabase.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", session.id),
    supabase.from("startup_members").select("role_title, startups(id, name, slug, is_verified)").eq("profile_id", session.id),
    supabase.from("connections").select("id, requester_id").eq("recipient_id", session.id).eq("status", "pending").limit(5),
    supabase.from("investor_introductions").select("id, investor_id, message").eq("founder_id", session.id).eq("status", "pending").limit(5),
  ]);
  const ids = [...new Set([...(requests.data ?? []).map((r) => r.requester_id), ...(intros.data ?? []).map((i) => i.investor_id)])];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
    : { data: [] as { id: string; full_name: string; avatar_url: string | null }[] };
  return {
    postCount: posts.count ?? 0,
    followCount: follows.count ?? 0,
    startups: (startups.data ?? []).flatMap((m) => {
      const s = Array.isArray(m.startups) ? m.startups[0] : m.startups;
      return s ? [{ ...s, role_title: m.role_title }] : [];
    }),
    requests: requests.data ?? [],
    intros: intros.data ?? [],
    people: people ?? [],
  };
}

type RailData = Awaited<ReturnType<typeof loadRailData>>;

function Ring({ done, total }: { done: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} style={{ transition: "stroke-dashoffset .6s ease" }} />
    </svg>
  );
}

/** First-run checklist: the shortest path from "just approved" to "active member". Disappears at 100%. */
export function SetupChecklist({ session, data }: { session: SessionProfile; data: RailData }) {
  const steps = [
    { done: !!session.avatar_url, label: "Add a profile photo", href: "/settings" },
    { done: !!session.handle, label: "Pick your @handle", href: "/settings" },
    { done: session.open_to.length > 0 || session.offering.length > 0, label: "Say what you are looking for", href: "/settings" },
    { done: data.postCount > 0, label: "Share your first update", href: "/feed#compose" },
    { done: data.followCount >= 3, label: "Follow 3 founders", href: "/discover" },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const next = steps.find((s) => !s.done)!;
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <div className="relative">
          <Ring done={done} total={steps.length} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tabular">{done}/{steps.length}</span>
        </div>
        <div>
          <CardTitle>Get set up</CardTitle>
          <p className="text-xs text-muted-foreground">About 3 minutes. Next: {next.label.toLowerCase()}.</p>
        </div>
      </CardHeader>
      <CardContent className="py-3">
        <ul className="space-y-1">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-3 rounded-sm px-1 py-1.5 text-sm hover:bg-muted/60">
                <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${s.done ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{s.done ? "✓" : ""}</span>
                <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export async function HomeRail({ session, dataPromise }: { session: SessionProfile; dataPromise: Promise<RailData> }) {
  const data = await dataPromise;
  const person = (id: string) => data.people.find((p) => p.id === id);
  const hasRequests = data.requests.length > 0 || data.intros.length > 0;
  return (
    <div className="space-y-4">
      <SetupChecklist session={session} data={data} />

      {hasRequests ? (
        <Card>
          <CardHeader><CardTitle>Needs your answer</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.requests.map((r) => (
              <div key={r.id} className="space-y-2">
                <Link href={`/founders/${r.requester_id}`} className="flex items-center gap-2 text-sm">
                  <Avatar name={person(r.requester_id)?.full_name ?? null} src={person(r.requester_id)?.avatar_url} size={28} />
                  <span><strong className="font-medium">{person(r.requester_id)?.full_name ?? "A member"}</strong> wants to connect</span>
                </Link>
                <span className="flex gap-2">
                  <ActionButton action={respondConnectionRow} label="Accept" hidden={{ id: r.id, accept: "true" }} variant="accent" size="sm" />
                  <ActionButton action={respondConnectionRow} label="Decline" hidden={{ id: r.id, accept: "false" }} variant="outline" size="sm" />
                </span>
              </div>
            ))}
            {data.intros.map((i) => (
              <div key={i.id} className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm"><strong className="font-medium">{person(i.investor_id)?.full_name ?? "An investor"}</strong> asked for an introduction</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{i.message}</p>
                <span className="flex gap-2">
                  <ActionButton action={respondIntroductionRow} label="Accept" hidden={{ id: i.id, accept: "true" }} variant="accent" size="sm" />
                  <ActionButton action={respondIntroductionRow} label="Decline" hidden={{ id: i.id, accept: "false" }} variant="outline" size="sm" />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {session.role === "investor" ? null : (
      <Card>
        <CardHeader><CardTitle>Your startup</CardTitle></CardHeader>
        <CardContent>
          {data.startups.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {data.startups.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <Link href={`/startups/${s.slug}`} className="truncate font-medium hover:underline">{s.name}</Link>
                  <Badge tone={s.is_verified ? "success" : "warning"}>{s.is_verified ? "Verified" : "In review"}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No company yet.</p>
          )}
          <Link href="/dashboard/startup" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            {data.startups.length > 0 ? "Manage your startup →" : "Set up your startup →"}
          </Link>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
