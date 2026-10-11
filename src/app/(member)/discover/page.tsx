import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { Flash } from "@/components/app/flash";
import { requestConnectionRow } from "@/lib/actions/community";
import { StartupCard } from "@/components/startups/startup-card";

export const metadata: Metadata = { title: "Discover" };

const clean = (v: string) => v.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();
  const q = sp.q ? clean(sp.q) : "";

  let people = supabase
    .from("public_founders").select("id, full_name, avatar_url, headline, location").neq("id", session.id).eq("is_demo", false).limit(30);
  if (q) people = people.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%`);
  let startups = supabase
    .from("startups").select("id, name, slug, logo_url, industry, stage, short_description, location")
    .eq("is_verified", true).eq("is_demo", false).limit(12);
  if (q) startups = startups.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);

  const [{ data: founders }, { data: companies }, { data: conns }] = await Promise.all([
    people, startups,
    supabase.from("connections").select("requester_id, recipient_id, status"),
  ]);
  const statusWith = (id: string) => conns?.find((c) => c.requester_id === id || c.recipient_id === id)?.status;

  return (
    <>
      <PageHeader title="Discover" description="Verified founders and startups across Ireland." />
      <Flash error={sp.error} />
      <form className="mb-8 flex max-w-xl gap-2" role="search">
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search founders and startups" aria-label="Search" />
        <Button type="submit">Search</Button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">Founders</h2>
      {founders?.length ? (
        <ul className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {founders.map((f) => {
            const st = statusWith(f.id!);
            return (
              <li key={f.id}>
                <Card><CardContent className="flex items-center justify-between gap-3">
                  <Link href={`/founders/${f.id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar name={f.full_name} src={f.avatar_url} />
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{f.full_name}</span><span className="block truncate text-xs text-muted-foreground">{f.headline}</span></span>
                  </Link>
                  {st === "accepted" ? <Link href="/messages" className="text-sm underline">Message</Link>
                    : st === "pending" ? <span className="text-xs text-muted-foreground">Pending</span>
                    : st ? null
                    : <ActionButton action={requestConnectionRow} hidden={{ id: f.id!, path: "/discover" }} label="Connect" size="sm" variant="outline" />}
                </CardContent></Card>
              </li>
            );
          })}
        </ul>
      ) : <div className="mb-10"><EmptyState title="No founders to show yet" /></div>}

      <h2 className="mb-3 text-lg font-semibold">Startups</h2>
      {companies?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{companies.map((c) => <StartupCard key={c.id} startup={c} />)}</div>
      ) : <EmptyState title="No startups to show yet" />}
    </>
  );
}
