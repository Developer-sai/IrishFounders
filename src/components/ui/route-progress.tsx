"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Thin top progress bar: starts the moment an internal link is clicked (instant feedback while the
 * server renders the next page) and completes when the URL changes. Transform-only animation.
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (timer.current) clearTimeout(timer.current);
      setState("loading");
      // safety net: never leave the bar hanging
      timer.current = setTimeout(() => setState("idle"), 10_000);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = setTimeout(() => setState("idle"), 350);
    return () => clearTimeout(t);
  }, [pathname, search]);

  if (state === "idle") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
      <div
        className="h-full origin-left bg-accent"
        style={{
          transform: state === "done" ? "scaleX(1)" : "scaleX(0.7)",
          opacity: state === "done" ? 0 : 1,
          transition: state === "done" ? "transform 150ms ease-out, opacity 300ms 150ms" : "transform 8s cubic-bezier(0.1, 0.6, 0.2, 1)",
        }}
      />
    </div>
  );
}

export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
