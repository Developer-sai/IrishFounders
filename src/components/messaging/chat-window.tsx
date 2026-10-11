"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markConversationRead, sendMessage } from "@/lib/actions/community";
import { SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/form-controls";

export type ChatMessage = { id: string; sender_id: string; content: string; created_at: string };

export function ChatWindow({
  conversationId, currentUserId, initial,
}: { conversationId: string; currentUserId: string; initial: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [state, action] = useActionState(sendMessage, null);
  const bottom = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== currentUserId) void markConversationRead(conversationId);
        },
      )
      .subscribe();
    void markConversationRead(conversationId);
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <div className="flex h-[60vh] flex-col rounded-lg border border-border bg-card">
      <ul className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite" aria-label="Messages">
        {messages.map((m) => (
          <li key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
            <span className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.sender_id === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
              <time className="mt-1 block text-[10px] opacity-60" dateTime={m.created_at}>
                {new Date(m.created_at).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
              </time>
            </span>
          </li>
        ))}
        <div ref={bottom} />
      </ul>
      <form ref={form} action={action} className="flex gap-2 border-t border-border p-3">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <Input name="content" placeholder="Write a message…" aria-label="Message" autoComplete="off" required maxLength={4000} />
        <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
      </form>
      {state && !state.ok ? <p role="alert" className="px-4 pb-3 text-xs text-destructive">{state.error}</p> : null}
    </div>
  );
}
