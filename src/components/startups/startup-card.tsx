import Link from "next/link";
import { Badge, Seal } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

export type StartupCardData = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string;
  stage: string;
  short_description: string;
  location: string | null;
};

export function StartupCard({ startup }: { startup: StartupCardData }) {
  return (
    <Link
      href={`/startups/${startup.slug}`}
      className="group flex h-full flex-col justify-between gap-6 border border-border bg-card p-5 transition-colors hover:border-foreground"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight" style={{ fontVariationSettings: '"opsz" 36, "SOFT" 40' }}>
            {startup.name}
          </h3>
          <Seal label="Verified startup" />
        </div>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{startup.location ?? "Ireland"}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground/75">{startup.short_description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{startup.industry}</Badge>
        <Badge>{humanize(startup.stage)}</Badge>
        <span aria-hidden className="ml-auto text-accent opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </div>
    </Link>
  );
}
