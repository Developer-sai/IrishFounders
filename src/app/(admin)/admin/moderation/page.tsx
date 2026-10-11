import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { Flash } from "@/components/app/flash";
import { moderateReportRow } from "@/lib/actions/admin";
import { formatDate, humanize } from "@/lib/utils";

export const metadata: Metadata = { title: "Moderation" };

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const { data: reports } = await supabase.from("reports").select("*").eq("status", "open").order("created_at").limit(100);

  // Resolve the reported content so moderators can see what they are acting on.
  const byType = (t: string) => (reports ?? []).filter((r) => r.target_type === t).map((r) => r.target_id);
  const [posts, comments, launches] = await Promise.all([
    byType("post").length ? supabase.from("posts").select("id, title, content").in("id", byType("post")) : Promise.resolve({ data: [] }),
    byType("comment").length ? supabase.from("post_comments").select("id, content").in("id", byType("comment")) : Promise.resolve({ data: [] }),
    byType("launch").length ? supabase.from("product_launches").select("id, name, tagline").in("id", byType("launch")) : Promise.resolve({ data: [] }),
  ]);
  const preview = (type: string, id: string): string => {
    if (type === "post") { const p = posts.data?.find((x) => x.id === id); return p ? (p.title ? `${p.title}: ` : "") + p.content.slice(0, 300) : "(removed)"; }
    if (type === "comment") return comments.data?.find((x) => x.id === id)?.content.slice(0, 300) ?? "(removed)";
    if (type === "launch") { const l = launches.data?.find((x) => x.id === id); return l ? `${l.name} — ${l.tagline}` : "(removed)"; }
    return `${humanize(type)} ${id}`;
  };

  return (
    <>
      <PageHeader title="Reports & moderation" description="Removing content records a moderation action and notifies the author with an explanation." />
      <Flash error={error} />
      {reports?.length ? (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id}><Card><CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3"><Badge>{humanize(r.target_type)}</Badge><span className="text-xs text-muted-foreground">{formatDate(r.created_at, true)}</span></div>
              <blockquote className="border-l-2 border-border pl-3 text-sm">{preview(r.target_type, r.target_id)}</blockquote>
              <p className="text-sm"><span className="text-muted-foreground">Reason:</span> {r.reason}</p>
              <form action={moderateReportRow} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <Input name="note" placeholder="Explanation sent to the author" aria-label="Note" className="max-w-sm" />
                <Button type="submit" name="action" value="remove_content" size="sm" variant="destructive">Remove content</Button>
                <Button type="submit" name="action" value="dismiss" size="sm" variant="outline">Dismiss</Button>
              </form>
            </CardContent></Card></li>
          ))}
        </ul>
      ) : <EmptyState title="The moderation queue is empty" />}
    </>
  );
}
