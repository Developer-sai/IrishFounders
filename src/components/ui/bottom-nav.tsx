"use client";

import { Compass, Home, Plus, Rocket, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/actions/auth";

export type MoreLink = { href: string; label: string; hint?: string };

const CREATE = [
  { href: "/feed#compose", label: "Post an update", hint: "Share progress with the community" },
  { href: "/stories/new", label: "Add a story", hint: "A quick update that lasts 24 hours" },
  { href: "/launches/new", label: "Launch a product", hint: "Founders only", founderOnly: true },
] as const;

/**
 * Mobile tab bar: Home, Discover, [+ create], Launch Day, Me.
 * Five targets at most (Instagram/iOS convention). "Me" opens a sheet with everything else,
 * so the bar stays simple however many features exist. Safe-area aware.
 */
export function BottomNav({
  homeHref = "/feed",
  discoverHref = "/discover",
  more,
  isFounder = true,
}: {
  homeHref?: string;
  discoverHref?: string;
  more: MoreLink[];
  isFounder?: boolean;
}) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<"create" | "more" | null>(null);

  useEffect(() => setSheet(null), [pathname]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const tab = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
        {label}
      </Link>
    );
  };

  const creates = CREATE.filter((c) => !("founderOnly" in c && c.founderOnly) || isFounder);

  return (
    <>
      {sheet ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={sheet === "create" ? "Create" : "More"}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-foreground/40" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto border-t border-foreground bg-card pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="eyebrow !text-foreground">{sheet === "create" ? "Create" : "More"}</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Close" className="p-2"><X className="h-4 w-4" /></button>
            </div>
            <ul>
              {(sheet === "create" ? creates : more).map((c) => (
                <li key={c.href} className="border-b border-border last:border-b-0">
                  <Link href={c.href} className="block px-5 py-3.5 active:bg-muted">
                    <span className={sheet === "create" ? "font-display text-xl" : "text-[15px] font-medium"}>{c.label}</span>
                    {"hint" in c && c.hint ? <span className="mt-0.5 block text-sm text-muted-foreground">{c.hint}</span> : null}
                  </Link>
                </li>
              ))}
              {sheet === "more" ? (
                <li>
                  <form action={signOut}><button type="submit" className="block w-full px-5 py-3.5 text-left text-[15px] text-muted-foreground active:bg-muted">Sign out</button></form>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-foreground/20 bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {tab(homeHref, "Home", Home)}
        {tab(discoverHref, "Discover", Compass)}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setSheet("create")}
            aria-label="Create"
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {tab("/launches", "Launch Day", Rocket)}
        <button
          type="button"
          onClick={() => setSheet("more")}
          aria-label="More"
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium ${sheet === "more" ? "text-foreground" : "text-muted-foreground"}`}
        >
          <UserRound className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          Me
        </button>
      </nav>
    </>
  );
}
