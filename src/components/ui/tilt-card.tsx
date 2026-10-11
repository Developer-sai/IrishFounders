"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-driven 3D tilt. Transform-only (GPU), one rAF per move, disabled on touch and for
 * reduced-motion so it never fights scrolling or accessibility settings.
 */
export function TiltCard({
  children,
  className,
  max = 5,
}: {
  children: React.ReactNode;
  className?: string;
  /** maximum tilt in degrees */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  function enabled() {
    return window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;
  }

  function onMove(e: React.PointerEvent) {
    if (!enabled() || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(0)`;
    });
  }

  function reset() {
    cancelAnimationFrame(raf.current);
    if (ref.current) ref.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn("transition-transform duration-200 ease-out will-change-transform [transform:perspective(1000px)_translateZ(0)]", className)}
    >
      {children}
    </div>
  );
}
