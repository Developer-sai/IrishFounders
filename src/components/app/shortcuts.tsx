"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const GO: Record<string, string> = { f: "/feed", d: "/discover", l: "/launches", m: "/messages", n: "/notifications" };

/**
 * Keyboard shortcuts, the same family power users know from Linear/GitHub:
 *   g then f/d/l/m/n  go to feed / discover / launches / messages / notifications
 *   n                 new post       /   open search
 * Ignored while typing and when modifier keys are held.
 */
export function Shortcuts() {
  const router = useRouter();

  useEffect(() => {
    let armed = false;
    let timer: ReturnType<typeof setTimeout>;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;

      if (armed) {
        armed = false;
        clearTimeout(timer);
        const to = GO[e.key.toLowerCase()];
        if (to) {
          e.preventDefault();
          router.push(to);
        }
        return;
      }
      if (e.key === "g") {
        armed = true;
        timer = setTimeout(() => (armed = false), 1200);
      } else if (e.key === "n") {
        e.preventDefault();
        router.push("/feed#compose");
      } else if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
