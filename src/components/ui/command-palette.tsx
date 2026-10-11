"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Item = { key: string; label: string; hint: string; href: string };
export type PaletteLink = { href: string; label: string };

const KIND_LABEL: Record<string, string> = { founder: "Founder", startup: "Startup", launch: "Launch" };

/** Cmd/Ctrl-K search + quick navigation. Native <dialog> gives focus trap and Esc for free. */
export function CommandPalette({ links, className = "" }: { links: PaletteLink[]; className?: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const open = useCallback(() => {
    dialog.current?.showModal();
    setTimeout(() => input.current?.focus(), 0);
  }, []);
  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRemote([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await createClient().rpc("search_all", { q: term });
      if (cancelled) return;
      setRemote((data ?? []).map((r) => ({ key: `${r.kind}-${r.id}`, label: r.title, hint: `${KIND_LABEL[r.kind] ?? r.kind}${r.subtitle ? ` · ${r.subtitle}` : ""}`, href: r.href })));
      setLoading(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const quick: Item[] = links
    .filter((l) => !q.trim() || l.label.toLowerCase().includes(q.trim().toLowerCase()))
    .map((l) => ({ key: `go-${l.href}`, label: l.label, hint: "Go to", href: l.href }));
  const items = [...remote, ...quick].slice(0, 12);

  useEffect(() => setActive(0), [q, remote.length]);

  function go(item: Item | undefined) {
    if (!item) return;
    close();
    setQ("");
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search (Ctrl K)"
        className={`inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-card px-3 text-[13px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground ${className}`}
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded-sm border border-border px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label="Search"
        className="m-0 mx-auto mt-[12vh] w-[min(560px,92vw)] border border-foreground bg-card p-0 text-foreground backdrop:bg-foreground/40"
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
            placeholder="Search founders, startups, launches…"
            className="h-14 w-full bg-transparent text-base placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="rounded-sm border border-border px-1.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto py-2">
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 ${i === active ? "bg-muted" : ""}`}
            >
              <span className="truncate text-sm font-medium">{item.label}</span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.hint}</span>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">{loading ? "Searching…" : "No results"}</li>
          ) : null}
        </ul>
      </dialog>
    </>
  );
}
