import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { toggleSavedRow } from "@/lib/actions/community";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const session = await requireMember();
  const supabase = await createClient();
  const { data: saved } = await supabase.from("saved_items").select("item_type, item_id").eq("user_id", session.id).order("created_at", { ascending: false });
  const ids = (t: string) => (saved ?? []).filter((s) => s.item_type === t).map((s) => s.item_id);
  const [posts, launches, startups] = await Promise.all([
    ids("post").length ? supabase.from("posts").select("id, title, content").in("id", ids("post")) : Promise.resolve({ data: [] }),
    ids("launch").length ? supabase.from("product_launches").select("id, name, tagline").in("id", ids("launch")) : Promise.resolve({ data: [] }),
    ids("startup").length ? supabase.from("startups").select("id, name, slug").in("id", ids("startup")) : Promise.resolve({ data: [] }),
  ]);
  const rows = [
    ...(posts.data ?? []).map((p) => ({ type: "post", id: p.id, label: p.title ?? p.content.slice(0, 80), href: "/feed" })),
    ...(launches.data ?? []).map((l) => ({ type: "launch", id: l.id, label: `${l.name} — ${l.tagline}`, href: "/launches" })),
    ...(startups.data ?? []).map((s) => ({ type: "startup", id: s.id, label: s.name, href: `/startups/${s.slug}` })),
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Saved" description="Posts, launches and startups you've bookmarked." />
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={`${r.type}-${r.id}`}><Card><CardContent className="flex items-center justify-between gap-3 py-4">
              <Link href={r.href} className="text-sm hover:underline">{r.label}</Link>
              <ActionButton action={toggleSavedRow} hidden={{ id: r.id, type: r.type, path: "/saved" }} label="Remove" variant="ghost" size="sm" />
            </CardContent></Card></li>
          ))}
        </ul>
      ) : <EmptyState title="Nothing saved yet" />}
    </div>
  );
}
