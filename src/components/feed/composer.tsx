"use client";

import { useEffect, useRef } from "react";

/**
 * Post composer shell. Collapsed to a one-line prompt on mobile so the feed leads,
 * open by default on desktop, and opened by the "#compose" link from the create sheet.
 */
export function Composer({ prompt, children }: { prompt: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      if (window.matchMedia("(min-width: 768px)").matches || window.location.hash === "#compose") el.open = true;
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <details ref={ref} id="compose" className="group mb-8 scroll-mt-20 border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm text-muted-foreground md:hidden [&::-webkit-details-marker]:hidden">
        <span>{prompt}</span>
        <span aria-hidden className="font-mono text-lg text-accent transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="p-5">{children}</div>
    </details>
  );
}
