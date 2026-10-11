import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ActionButton, ActionForm } from "@/components/ui/action-form";
import { Textarea } from "@/components/ui/form-controls";
import { ChatWindow } from "@/components/messaging/chat-window";
import { Flash } from "@/components/app/flash";
import { blockUserRow, reportContent } from "@/lib/actions/community";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await requireMember();
  const supabase = await createClient();

  const { data: convs } = await supabase
    .from("conversations").select("id, participant_one, participant_two, last_message_at").order("last_message_at", { ascending: false });
  const otherId = (c: { participant_one: string; participant_two: string }) => (c.participant_one === session.id ? c.participant_two : c.participant_one);
  const otherIds = (convs ?? []).map(otherId);
  const [{ data: people }, { data: unread }] = await Promise.all([
    otherIds.length ? supabase.from("profiles").select("id, full_name, avatar_url, headline").in("id", otherIds) : Promise.resolve({ data: [] }),
    supabase.from("messages").select("conversation_id").eq("is_read", false).neq("sender_id", session.id),
  ]);
  const unreadBy = new Map<string, number>();
  for (const m of unread ?? []) unreadBy.set(m.conversation_id, (unreadBy.get(m.conversation_id) ?? 0) + 1);

  const active = convs?.find((c) => c.id === sp.c) ?? convs?.[0];
  const activePerson = active ? people?.find((p) => p.id === otherId(active)) : undefined;
  const { data: msgs } = active
    ? await supabase.from("messages").select("id, sender_id, content, created_at").eq("conversation_id", active.id).order("created_at").limit(200)
    : { data: [] };

  return (
    <>
      <PageHeader title="Messages" description="Private conversations with your accepted connections." />
      <Flash error={sp.error} />
      {!convs?.length ? (
        <EmptyState title="No conversations yet" description="Connect with a member from Discover. Once they accept, you can message each other here." action={<Link href="/discover" className="text-sm underline">Discover members</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <nav aria-label="Conversations" className="space-y-2">
            {convs.map((c) => {
              const p = people?.find((x) => x.id === otherId(c));
              const n = unreadBy.get(c.id) ?? 0;
              return (
                <Link key={c.id} href={`/messages?c=${c.id}`} className={`flex items-center gap-3 rounded-lg border p-3 ${active?.id === c.id ? "border-primary bg-card" : "border-border bg-card/50"}`}>
                  <Avatar name={p?.full_name ?? null} src={p?.avatar_url} size={36} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p?.full_name ?? "Member"}</span><span className="block truncate text-xs text-muted-foreground">{p?.headline}</span></span>
                  {n > 0 ? <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground" aria-label={`${n} unread`}>{n}</span> : null}
                </Link>
              );
            })}
          </nav>
          {active ? (
            <section aria-label="Conversation">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{activePerson?.full_name ?? "Member"}</h2>
                <div className="flex items-center gap-3">
                  <details>
                    <summary className="cursor-pointer text-xs text-muted-foreground">Report</summary>
                    <Card className="absolute z-10 mt-1 w-72 p-3">
                      <ActionForm action={reportContent} submitLabel="Report conversation" successMessage="Reported." buttonProps={{ size: "sm", variant: "outline" }} className="space-y-2">
                        <input type="hidden" name="target_type" value="conversation" />
                        <input type="hidden" name="target_id" value={active.id} />
                        <Textarea name="reason" placeholder="What happened?" required minLength={3} />
                      </ActionForm>
                    </Card>
                  </details>
                  <ActionButton action={blockUserRow} hidden={{ id: otherId(active) }} label="Block" variant="ghost" size="sm" />
                </div>
              </div>
              <ChatWindow key={active.id} conversationId={active.id} currentUserId={session.id} initial={msgs ?? []} />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
