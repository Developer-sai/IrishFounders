import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The iF monogram. The artwork carries its own near-black tile, so it works on any surface. */
export function LogoMark({ size = 32, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/mark-96.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-[22%]", className)}
    />
  );
}

/**
 * Monogram + wordmark ("Irish" in text colour, "Founders" in brand emerald), matching the logo lockup.
 * `onDark` forces light text for surfaces that are dark in both themes (sidebars, auth panel).
 */
export function Logo({
  onDark = false,
  size = 32,
  href = "/",
  className,
  priority = false,
}: {
  onDark?: boolean;
  size?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const inner = (
    <>
      <LogoMark size={size} priority={priority} />
      <span
        className={cn("whitespace-nowrap font-display font-bold leading-none tracking-[-0.03em]", onDark && "text-[hsl(150_20%_96%)]")}
        style={{ fontSize: Math.round(size * 0.62) }}
      >
        Irish<span className={onDark ? "text-[#1BE58D]" : "text-accent"}>Founders</span>
      </span>
    </>
  );
  const cls = cn("inline-flex items-center gap-2.5", className);
  return href ? (
    <Link href={href} aria-label="Irish Founders, home" className={cls}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
