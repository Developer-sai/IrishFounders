"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

export type GlobeMarker = { lat: number; lng: number; kind: "verified" | "pending" };

/** Decorative arcs between world hubs. Illustrative only: they do not represent real members. */
const ARCS: { from: [number, number]; to: [number, number] }[] = [
  { from: [51.5, -0.1], to: [40.7, -74.0] }, // London - New York
  { from: [40.7, -74.0], to: [37.8, -122.4] }, // New York - San Francisco
  { from: [51.5, -0.1], to: [6.5, 3.4] }, // London - Lagos
  { from: [6.5, 3.4], to: [-1.3, 36.8] }, // Lagos - Nairobi
  { from: [25.2, 55.3], to: [12.97, 77.6] }, // Dubai - Bengaluru
  { from: [12.97, 77.6], to: [1.35, 103.8] }, // Bengaluru - Singapore
  { from: [1.35, 103.8], to: [-33.9, 151.2] }, // Singapore - Sydney
  { from: [-23.5, -46.6], to: [51.5, -0.1] }, // Sao Paulo - London
];
const START_LNG = 10; // Atlantic: Europe, Africa and the Americas are all in view on first paint

/** COBE's phi rotates around the vertical axis. Calibrated against a fixed-angle render: longitude 0 faces the camera at phi ~ 4.89. */
const phiFor = (lng: number) => (lng * Math.PI) / 180 + 5.03;

function lowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || !!nav.connection?.saveData;
}

/**
 * Interactive WebGL globe (COBE, ~5 kB). Smoothness rules:
 *  - the render loop only runs while the canvas is on screen and the tab is visible;
 *  - device pixel ratio is capped;
 *  - reduced-motion and low-power devices never start WebGL (the static poster stays);
 *  - the canvas has a fixed aspect ratio so nothing shifts when it appears.
 */
export default function Globe({ markers, className = "" }: { markers: GlobeMarker[]; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    const box = wrap.current;
    if (!el || !box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || lowPowerDevice()) return;

    let phi = phiFor(START_LNG);
    const theta = 0.5;
    let dragging = false;
    let lastX = 0;
    // test hook: lets the poster be rendered from a frozen frame
    const idleSpin = (window as unknown as { __globeFreeze?: boolean }).__globeFreeze ? 0 : 0.0035;
    let velocity = idleSpin;
    let visible = false;
    let raf = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    const mobile = box.clientWidth < 520;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    function build() {
      const size = box!.clientWidth;
      if (!size) return;
      globe?.destroy();
      el!.width = size * dpr;
      el!.height = size * dpr;
      globe = createGlobe(el!, {
        width: size * dpr,
        height: size * dpr,
        devicePixelRatio: dpr,
        phi,
        theta,
        dark: 1,
        diffuse: 1.15,
        mapSamples: mobile ? 9000 : 16000,
        mapBrightness: 5.5,
        baseColor: [0.05, 0.2, 0.16],
        markerColor: [0.11, 0.9, 0.55],
        glowColor: [0.04, 0.45, 0.32],
        markerElevation: 0.02,
        // only for poster generation: keeps the frame readable via toDataURL()
        context: (window as unknown as { __globeFreeze?: boolean }).__globeFreeze ? { preserveDrawingBuffer: true } : undefined,
        markers: markers.map((m) => ({
          location: [m.lat, m.lng],
          size: m.kind === "verified" ? 0.032 : 0.022,
          color: m.kind === "verified" ? [0.2, 1, 0.62] : [0.3, 0.62, 0.5],
        })),
        arcs: mobile ? ARCS.slice(0, 4) : ARCS,
        arcColor: [0.55, 0.98, 0.51],
        arcWidth: 0.5,
        arcHeight: 0.28,
      });
      setReady(true);
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || !globe) return;
      if (!dragging) {
        phi += velocity;
        velocity += (idleSpin - velocity) * 0.04; // ease back to the idle spin after a drag
      }
      globe.update({ phi, theta });
    }

    const io = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; }, { rootMargin: "120px" });
    io.observe(box);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });
    ro.observe(box);

    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      phi += dx * 0.006;
      velocity = dx * 0.0006;
    };
    const up = () => { dragging = false; el.style.cursor = "grab"; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    build();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      globe?.destroy();
    };
  }, [markers]);

  return (
    <div ref={wrap} className={`relative aspect-square w-full ${className}`}>
      <canvas
        ref={canvas}
        aria-hidden
        className="absolute inset-0 h-full w-full cursor-grab touch-pan-y transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0, contain: "layout paint size" }}
      />
    </div>
  );
}
