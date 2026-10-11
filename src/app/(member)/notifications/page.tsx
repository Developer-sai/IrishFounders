import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/ui/action-form";
import { markNotificationsReadRow } from "@/lib/actions/community";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireMember();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", session.id).order("created_at", { ascending: false }).limit(50);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" action={data?.some((n) => !n.is_read) ? <ActionButton action={markNotificationsReadRow} label="Mark all read" variant="outline" size="sm" /> : undefined} />
      {data?.length ? (
        <ul className="space-y-2">
          {data.map((n) => (
            <li key={n.id}>
              <Card className={n.is_read ? "opacity-70" : ""}><CardContent className="flex items-start justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-medium">{n.link ? <Link href={n.link} className="hover:underline">{n.title}</Link> : n.title}</p>
                  {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.created_at, true)}</span>
              </CardContent></Card>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="You're all caught up" />}
    </div>
  );
}
