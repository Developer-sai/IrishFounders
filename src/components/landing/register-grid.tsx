import Link from "next/link";
import { Seal } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

export type RegisterRow = {
  kind: string;
  name: string;
  slug: string | null;
  industry: string | null;
  stage: string | null;
  city: string | null;
  logo_url: string | null;
};

function Initial({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" width={44} height={44} loading="lazy" className="h-11 w-11 shrink-0 rounded-sm bg-muted object-cover" />;
  }
  return (
    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-accent/80 to-verified/20 font-display text-xl font-semibold text-accent-foreground">
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/** Every company in the register: verified ones link to their profile, in-review ones are clearly marked. */
export function RegisterGrid({ rows }: { rows: RegisterRow[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r, i) => {
        const meta = [r.city, r.industry].filter(Boolean).join(" · ");
        const verified = r.kind === "verified";
        const body = (
          <>
            <Initial name={r.name} logo={r.logo_url} />
            <span className="min-w-0 flex-1">
              <span className={`block truncate font-display text-lg font-semibold leading-tight ${verified ? "" : "text-foreground/70"}`}>{r.name}</span>
              <span className="mt-0.5 block truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {meta || (r.stage ? humanize(r.stage) : "Ireland")}
              </span>
            </span>
            {verified ? (
              <Seal label="Verified startup" />
            ) : (
              <span className="shrink-0 border border-dashed border-foreground/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">In review</span>
            )}
          </>
        );
        return (
          <li key={`${r.kind}-${r.slug ?? r.name}-${i}`}>
            {verified && r.slug ? (
              <Link href={`/startups/${r.slug}`} className="tilt flex items-center gap-3 border border-border bg-card p-3.5">
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 border border-dashed border-border bg-card/40 p-3.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
