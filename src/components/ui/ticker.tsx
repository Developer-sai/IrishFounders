"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Number that counts up once when it scrolls into view. The server renders the final value
 * (good for SEO, no layout shift, works without JS); the count-up is purely progressive.
 */
export function Ticker({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const duration = 900;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {shown}
    </span>
  );
}
