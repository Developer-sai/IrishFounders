"use client";

import { useEffect, useState } from "react";

type ToastItem = { id: number; message: string; tone: "success" | "error" };
const EVENT = "if:toast";

/** Fire a toast from anywhere on the client: toast("Saved"). */
export function toast(message: string, tone: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

/** Mount once in the root layout. Polite live region, auto-dismiss, transform/opacity only. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let n = 0;
    function onToast(e: Event) {
      const { message, tone } = (e as CustomEvent<{ message: string; tone: ToastItem["tone"] }>).detail;
      const id = ++n;
      setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-[rise_0.25s_ease-out] border px-4 py-2.5 text-sm shadow-lg ${
            t.tone === "success" ? "border-accent/50 bg-card text-foreground" : "border-destructive/50 bg-card text-destructive"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
