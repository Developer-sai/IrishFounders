import { cn } from "@/lib/utils";

/**
 * Profile / startup cover. Uses the uploaded image, or a quiet pattern of Georgian fanlights
 * so an empty cover still looks designed, never broken.
 */
export function CoverImage({ src, className }: { src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <svg aria-hidden className={cn("h-full w-full", className)} preserveAspectRatio="xMidYMid slice" viewBox="0 0 480 120">
      <defs>
        <pattern id="fanlight" width="48" height="40" patternUnits="userSpaceOnUse">
          <path d="M6 40V24a18 18 0 0 1 36 0v16" fill="none" stroke="hsl(var(--foreground) / 0.12)" strokeWidth="1" />
          <path d="M24 6v34M12 28l24-4M36 28 12 24" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="120" fill="hsl(var(--muted))" />
      <rect width="480" height="120" fill="url(#fanlight)" />
    </svg>
  );
}
