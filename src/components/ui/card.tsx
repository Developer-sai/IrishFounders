import { cn } from "@/lib/utils";

/** Flat, hairline-bordered panel. No shadow: structure comes from rules, not elevation. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 border-b border-border px-5 py-3.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("eyebrow !text-foreground/70", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

const BADGE = {
  neutral: "border-border bg-muted/60 text-foreground/80",
  success: "border-verified/30 bg-verified/10 text-verified",
  warning: "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof BADGE }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider",
        BADGE[tone],
        className,
      )}
      {...props}
    />
  );
}

/** The brand device: a circular seal marking something a person has checked. */
export function Seal({ className, label = "Verified" }: { className?: string; label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-verified bg-verified/10 text-verified",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m3.5 8.5 3 3 6-7" />
      </svg>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-start gap-2 overflow-hidden rounded-lg border border-dashed border-foreground/25 px-6 py-10">
      <svg aria-hidden viewBox="0 0 120 120" className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-70">
        <defs>
          <radialGradient id="emptyglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent) / 0.28)" />
            <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#emptyglow)" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="hsl(var(--accent) / 0.5)" strokeWidth="1.2" />
        <ellipse cx="60" cy="60" rx="34" ry="12" fill="none" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1" />
        <ellipse cx="60" cy="60" rx="12" ry="34" fill="none" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1" />
        <circle cx="86" cy="42" r="3.5" fill="hsl(var(--accent))" />
      </svg>
      <p className="eyebrow">Nothing here yet</p>
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/20 pb-5">
      <div>
        <h1 className="display text-3xl md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, src, size = 40 }: { name: string | null; src?: string | null; size?: number }) {
  const label = (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? "Avatar"} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground/90 font-mono text-[11px] font-medium text-background"
      style={{ width: size, height: size }}
    >
      {label}
    </span>
  );
}
