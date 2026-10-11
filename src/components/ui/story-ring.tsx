import { Avatar } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Avatar with a story ring: vermilion = unseen, hairline = seen, none = no active story.
 * Verified seal is overlaid when `verified` is set (the brand device).
 */
export function StoryRing({
  name,
  src,
  size = 56,
  state = "none",
  verified = false,
}: {
  name: string | null;
  src?: string | null;
  size?: number;
  state?: "unseen" | "seen" | "none";
  verified?: boolean;
}) {
  const ring =
    state === "unseen" ? "border-accent" : state === "seen" ? "border-foreground/25" : "border-transparent";
  return (
    <span className="relative inline-flex">
      <span className={cn("inline-flex rounded-full border-2 p-[2px]", ring)}>
        <span className="inline-flex rounded-full border-2 border-background">
          <Avatar name={name} src={src} size={size} />
        </span>
      </span>
      {verified ? (
        <span
          role="img"
          aria-label="Verified"
          className="absolute -bottom-0.5 -right-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-background bg-verified text-accent-foreground"
        >
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        </span>
      ) : null}
    </span>
  );
}
