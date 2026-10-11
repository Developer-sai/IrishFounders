"use client";

import { Compass, MessageSquare, Newspaper, Plus, Rocket, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/feed", label: "Home", icon: Newspaper },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/launches", label: "Launches", icon: Rocket },
  { href: "/messages", label: "Messages", icon: MessageSquare },
] as const;

const CREATE = [
  { href: "/feed#compose", label: "Post an update", hint: "Share progress with the community" },
  { href: "/stories/new", label: "Add a story", hint: "A quick update that lasts 24 hours" },
  { href: "/launches/new", label: "Launch a product", hint: "Founders only" },
] as const;

/** Mobile-only tab bar. The centre "+" opens a create sheet. Safe-area aware. */
export function BottomNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState(false);

  useEffect(() => setSheet(false), [pathname]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const tab = (t: (typeof TABS)[number]) => {
    const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
    const Icon = t.icon;
    return (
      <Link
        key={t.href}
        href={t.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
        {t.label}
        {t.href === "/messages" && unread > 0 ? <span className="sr-only">{unread} unread</span> : null}
      </Link>
    );
  };

  return (
    <>
      {sheet ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Create">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 border-t border-foreground bg-card pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="eyebrow !text-foreground">Create</p>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close" className="p-2"><X className="h-4 w-4" /></button>
            </div>
            <ul>
              {CREATE.map((c) => (
                <li key={c.href} className="border-b border-border last:border-b-0">
                  <Link href={c.href} className="block px-5 py-4 active:bg-muted">
                    <span className="font-display text-xl">{c.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{c.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-foreground/20 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {tab(TABS[0])}
        {tab(TABS[1])}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-label="Create"
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </nav>
    </>
  );
}
