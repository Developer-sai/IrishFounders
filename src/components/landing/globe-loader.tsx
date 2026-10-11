"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import type { GlobeMarker } from "./globe";

const Globe = dynamic(() => import("./globe"), { ssr: false });

/**
 * Static poster first (good LCP, works without WebGL, reduced-motion and low-power fallback),
 * then the live globe fades in on top once its small chunk has loaded.
 */
export function GlobeLoader({ markers, className = "", priority = true }: { markers: GlobeMarker[]; className?: string; priority?: boolean }) {
  return (
    <div className={`relative aspect-square w-full ${className}`}>
      <Image
        src="/brand/globe-poster.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 520px, 90vw"
        priority={priority}
        className="select-none object-contain"
        draggable={false}
      />
      <div className="absolute inset-0">
        <Globe markers={markers} />
      </div>
    </div>
  );
}
