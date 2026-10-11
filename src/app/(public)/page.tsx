import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, Seal } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

const CHECKS = [
  ["Company website", "A real site that belongs to the company"],
  ["LinkedIn page", "50+ genuine followers, checked by a person"],
  ["Recent activity", "Two to three real company posts"],
  ["Your link to it", "Evidence you actually work there"],
  ["Short interview", "Six questions, written, read by a human"],
];

const STEPS = [
  ["Apply", "Tell us who you are and what you are building. About ten minutes."],
  ["We check", "A person opens your website and your LinkedIn page. Nothing is auto-approved, nothing is scraped."],
  ["Short interview", "Six written questions. Video on request. We want to know why you started this."],
  ["You are in", "Approved members get the community, launches, design partners and introductions."],
];

const BENEFITS = [
  ["Find your first users", "Post a design-partner request and get feedback from founders who build the same way you do."],
  ["Meet the people", "Co-founders, designers, advisers. Every profile belongs to someone we have checked."],
  ["Launch with an audience", "Put a real product in front of members who will actually try it, and tell you what is broken."],
  ["Introductions on your terms", "Verified investors can ask to be introduced. Nothing opens until you say yes."],
];

const FAQ = [
  ["Is it free?", "Yes. Membership is free for founders. There are no tiers, no paid placement and no hidden charges."],
  ["Who can join?", "Founders with a genuine company, investors, and approved ecosystem partners based in or building for Ireland."],
  ["What exactly do you verify?", "A real company website, a company LinkedIn page with at least 50 followers and recent posts, your connection to the company, and a short interview. All of it is reviewed by hand."],
  ["Does a badge guarantee an investor will invest?", "No. A badge says what our team reviewed. It is not financial advice and not a guarantee of capacity or commitment."],
];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: stats }, { data: startups }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase
      .from("startups")
      .select("id, name, slug, industry, stage, location")
      .eq("is_verified", true)
      .eq("is_demo", false)
      .order("verified_at", { ascending: false })
      .limit(8),
  ]);
  const s = (stats ?? {}) as { verified_startups?: number; approved_founders?: number; launches?: number };
  const ledger: [string, number][] = [
    ["Verified startups", s.verified_startups ?? 0],
    ["Verified founders", s.approved_founders ?? 0],
    ["Products launched", s.launches ?? 0],
  ];

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="grid gap-12 pb-20 pt-14 md:grid-cols-12 md:pt-24">
        <div className="md:col-span-7">
          <p className="eyebrow rise">Dublin · Members by approval · Free for founders</p>
          <h1 className="display rise mt-6 text-[44px] sm:text-6xl lg:text-[76px]" style={{ animationDelay: "60ms" }}>
            Where Ireland&apos;s founders <em className="font-normal italic text-accent">build together.</em>
          </h1>
          <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-foreground/75" style={{ animationDelay: "140ms" }}>
            A community you have to be vouched into. Every founder, company and investor is checked by a person before
            they can say a word, so the people you meet are who they say they are.
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "220ms" }}>
            <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Apply to join</Link>
            <Link href="/startups" className="text-sm font-medium underline underline-offset-[6px] hover:text-accent">
              Browse the register →
            </Link>
          </div>
        </div>

        <aside className="rise md:col-span-5" style={{ animationDelay: "260ms" }} aria-label="What we check">
          <div className="border border-foreground/80 bg-card">
            <div className="flex items-center justify-between border-b border-foreground/80 px-5 py-3">
              <span className="eyebrow !text-foreground">What every entry passes</span>
              <span className="eyebrow">Illustration</span>
            </div>
            <ul>
              {CHECKS.map(([t, d], i) => (
                <li key={t} className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0">
                  <span className="font-mono text-xs text-muted-foreground tabular">0{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{d}</p>
                  </div>
                  <Seal label="Checked by a person" />
                </li>
              ))}
            </ul>
            <p className="border-t border-foreground/80 bg-muted/50 px-5 py-3 font-mono text-[11px] text-muted-foreground">
              Reviewed by a person. Never by a script.
            </p>
          </div>
        </aside>
      </section>

      {/* ------------------------------------------------------------ live ledger */}
      <section aria-label="The community in numbers" className="border-y border-foreground/80">
        <dl className="grid grid-cols-3 divide-x divide-border">
          {ledger.map(([label, value]) => (
            <div key={label} className="px-3 py-6 sm:px-6 sm:py-8">
              <dd className="display tabular text-4xl sm:text-6xl">{value}</dd>
              <dt className="eyebrow mt-2">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ register */}
      <section className="py-24" aria-labelledby="register">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">The register</p>
            <h2 id="register" className="display mt-2 text-3xl md:text-5xl">Verified startups</h2>
          </div>
          <Link href="/startups" className="text-sm font-medium underline underline-offset-[6px] hover:text-accent">All startups →</Link>
        </div>
        {startups && startups.length > 0 ? (
          <ol className="border-t border-foreground/80">
            {startups.map((st, i) => (
              <li key={st.id} className="border-b border-border">
                <Link href={`/startups/${st.slug}`} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-5 transition-colors hover:bg-card sm:grid-cols-[3rem_1fr_12rem_9rem_auto]">
                  <span className="font-mono text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl" style={{ fontVariationSettings: '"opsz" 36' }}>{st.name}</span>
                  <span className="hidden text-sm text-muted-foreground sm:block">{st.industry}</span>
                  <span className="hidden font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:block">{humanize(st.stage)}</span>
                  <Seal label="Verified startup" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="The register is open, and empty."
            description="Every company listed here has been checked by hand. The first founders are being reviewed now. Apply to be one of them."
            action={<Link href="/signup" className={buttonVariants({ variant: "accent" })}>Apply to join</Link>}
          />
        )}
      </section>

      {/* ------------------------------------------------------------ process */}
      <section className="grid gap-10 py-12 md:grid-cols-12" aria-labelledby="how">
        <div className="md:col-span-4">
          <p className="eyebrow">Membership</p>
          <h2 id="how" className="display mt-2 text-3xl md:text-5xl">How you get in</h2>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Four steps. Slower than a signup form on purpose. That is the point.
          </p>
        </div>
        <ol className="md:col-span-8">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[4rem_1fr] gap-4 border-t border-foreground/80 py-6 first:border-t-0 md:grid-cols-[6rem_1fr]">
              <span className="display tabular text-5xl text-accent md:text-6xl">{i + 1}</span>
              <div>
                <h3 className="font-display text-2xl" style={{ fontVariationSettings: '"opsz" 36' }}>{t}</h3>
                <p className="mt-1 max-w-lg text-foreground/70">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ benefits */}
      <section className="py-24" aria-labelledby="benefits">
        <p className="eyebrow">Inside</p>
        <h2 id="benefits" className="display mt-2 max-w-2xl text-3xl md:text-5xl">What members actually do here</h2>
        <dl className="mt-10 border-t border-foreground/80">
          {BENEFITS.map(([t, d]) => (
            <div key={t} className="grid gap-2 border-b border-border py-6 md:grid-cols-12 md:gap-8">
              <dt className="font-display text-2xl md:col-span-5" style={{ fontVariationSettings: '"opsz" 36' }}>{t}</dt>
              <dd className="max-w-xl text-foreground/70 md:col-span-7">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ faq */}
      <section className="grid gap-10 py-12 md:grid-cols-12" aria-labelledby="faq">
        <div className="md:col-span-4">
          <p className="eyebrow">Questions</p>
          <h2 id="faq" className="display mt-2 text-3xl md:text-5xl">Straight answers</h2>
        </div>
        <div className="border-t border-foreground/80 md:col-span-8">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl [&::-webkit-details-marker]:hidden" style={{ fontVariationSettings: '"opsz" 36' }}>
                {q}
                <span aria-hidden className="font-mono text-lg text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-xl text-foreground/70">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ closing */}
      <section className="mt-16 bg-primary px-6 py-16 text-primary-foreground md:px-14 md:py-24">
        <h2 className="display max-w-3xl text-4xl md:text-6xl">
          Building something in Ireland? <em className="italic opacity-70">Come and be checked.</em>
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Apply to join</Link>
          <span className="font-mono text-[11px] uppercase tracking-wider opacity-70">Free · Reviewed by hand</span>
        </div>
      </section>
    </>
  );
}
