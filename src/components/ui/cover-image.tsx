import { cn } from "@/lib/utils";

/**
 * Profile / startup cover. Uses the uploaded image, or a quiet pattern of rising chevrons
 * (echoing the logo's growth arrow) so an empty cover still looks designed, never broken.
 */
export function CoverImage({ src, className }: { src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <svg aria-hidden className={cn("h-full w-full", className)} preserveAspectRatio="xMidYMid slice" viewBox="0 0 480 120">
      <defs>
        <pattern id="chevrons" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M6 30 20 16l14 14" fill="none" stroke="hsl(var(--accent) / 0.22)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 38 20 24l14 14" fill="none" stroke="hsl(var(--accent) / 0.10)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </pattern>
        <radialGradient id="coverglow" cx="80%" cy="0%" r="80%">
          <stop offset="0%" stopColor="hsl(var(--accent) / 0.25)" />
          <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
        </radialGradient>
      </defs>
      <rect width="480" height="120" fill="hsl(var(--muted))" />
      <rect width="480" height="120" fill="url(#chevrons)" />
      <rect width="480" height="120" fill="url(#coverglow)" />
    </svg>
  );
}
