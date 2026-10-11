import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-sm border px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors";

/** Static label chip. `tone="accent"` is used for "Open to ..." intent. */
export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "accent" | "verified";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-border bg-muted/60 text-foreground/80",
    accent: "border-accent/40 bg-accent/10 text-accent",
    verified: "border-verified/30 bg-verified/10 text-verified",
  } as const;
  return <span className={cn(base, tones[tone], className)}>{children}</span>;
}

/** A filter chip that is a link (server-friendly, works without JS). */
export function ChipLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        base,
        active ? "border-foreground bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export const OPEN_TO_LABELS: Record<string, string> = {
  cofounder: "A co-founder",
  mentor: "A mentor",
  hiring: "Hiring",
  investors: "Investors",
  design_partners: "Design partners",
  collaborators: "Collaborators",
};

export const OFFERING_LABELS: Record<string, string> = {
  cofounder: "Co-founding",
  mentor: "Mentoring",
  talent: "My skills for hire",
  investment: "Investing",
  feedback: "Feedback & testing",
  collaboration: "Collaborating",
};
