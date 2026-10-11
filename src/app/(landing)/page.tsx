import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, Seal } from "@/components/ui/card";
import { Reveal } from "@/components/landing/reveal";
import {
  Dot, FeedMock, LaunchMock, MatchMock, ProfileGridMock, StoryMock,
} from "@/components/landing/mock";
import { humanize } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Irish Founders: world-class products from Ireland to the world" },
  description:
    "From idea to startup, from Ireland to the world. A free, verified network for founders building world-class products in Ireland, and the investors and partners everywhere who want to back them.",
  openGraph: {
    title: "Irish Founders: world-class products from Ireland to the world",
    description: "Companies built in Ireland. Investors from anywhere. Every member checked by a person.",
    url: "/",
  },
};

const wrap = "mx-auto w-full max-w-[1180px] px-5";

const CITIES = ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", "Sligo", "Derry", "Belfast", "Athlone", "Drogheda", "Tralee", "The World"];

const CHECKS = [
  ["Company website", "A real site that belongs to the company"],
  ["LinkedIn page", "50+ genuine followers, checked by a person"],
  ["Recent activity", "Two to three real company posts"],
  ["Your link to it", "Evidence you actually work there"],
  ["Short interview", "Six written questions, read by a human"],
];

const STEPS = [
  ["Apply", "Tell us who you are and what you are building. About ten minutes."],
  ["We check", "A person opens your website and LinkedIn page. Nothing is auto-approved and nothing is scraped."],
  ["Interview", "Six written questions. Video on request. We want to know why you started this."],
  ["You are in", "Approved members get stories, matching, launches and introductions."],
];

const OTHERS = ["Anyone can sign up with any email", "Fake companies and borrowed job titles", "Cold DMs from people you cannot place", "Engagement farming and noise"];
const OURS = [
  "Every member is reviewed and interviewed by a person",
  "Company website and LinkedIn page checked before you are listed",
  "Messaging opens only after both sides accept",
  "Companies built in Ireland, investors and partners from anywhere in the world",
];

const FAQ = [
  ["Is it free?", "Yes. Membership is free for founders. There are no tiers, no paid placement and no hidden charges."],
  ["Who can join?", "Founders building a genuine company in Ireland, whether you are Irish or from anywhere else. Investors from anywhere in the world. And ecosystem partners such as accelerators, universities and support organisations."],
  ["What exactly do you verify?", "A real company website, a company LinkedIn page with at least 50 followers and recent posts, your connection to the company, and a short interview. Everything is reviewed by hand."],
  ["How long does approval take?", "Applications are reviewed by a person, in the order they arrive. You can follow progress on your application status page and you will see a notification when something changes."],
  ["Does a verified badge guarantee an investor will invest?", "No. A badge says what our team reviewed. It is not financial advice and not a guarantee of capacity or commitment. Irish Founders facilitates introductions only."],
  ["Do I need to be Irish?", "No. If you are starting or running a company in Ireland you can apply, wherever you are from. Investors do not need any connection to Ireland. Join from anywhere in the world."],
  ["Is it only for Dublin?", "No. It is for companies across all of Ireland, north and south."],
];

const ROLES = [
  ["Founders", "Starting a company in Ireland? Irish or international, you belong here.", ["Share updates and 24-hour stories", "Get matched with co-founders, mentors and design partners", "Launch your product on Launch Day to a global audience", "Be introduced to verified investors, on your terms"]],
  ["Investors", "From anywhere in the world. Meet Irish-built companies that have been checked.", ["Browse verified startups and milestones", "Filter by industry, stage and location", "Request introductions. Nothing opens until the founder says yes", "No funds handled and no financial advice given"]],
  ["Ecosystem partners", "Accelerators, universities and support organisations.", ["Publish programmes, events and grants", "Every listing links to its official source", "Approved before it goes live", "Expired listings archive automatically"]],
] as const;

const TRUST = [
  ["Reviewed by people", "Every application is read by a human. We never auto-approve and we never scrape LinkedIn."],
  ["Private by design", "Verification documents live in private storage and are only visible to you and our reviewers."],
  ["You control contact", "Direct messages open only after a connection is accepted. Block or report anyone, any time."],
  ["Honest by default", "No fake members, no fabricated numbers. Every statistic on this page is a live count."],
];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: stats }, { data: startups }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase.from("startups").select("id, name, slug, industry, stage, location").eq("is_verified", true).eq("is_demo", false).order("verified_at", { ascending: false }).limit(8),
  ]);
  const s = (stats ?? {}) as { verified_startups?: number; approved_founders?: number; launches?: number };
  const ledger: [string, number][] = [
    ["Verified startups", s.verified_startups ?? 0],
    ["Verified founders", s.approved_founders ?? 0],
    ["Products launched", s.launches ?? 0],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Irish Founders",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://irishfounders.vercel.app",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://irishfounders.vercel.app"}/brand/mark-512.png`,
    description: "A free, verified network for companies built in Ireland and the investors and partners around the world who back them.",
  };

  return (
    <>
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ============================================================ HERO */}
      <section className="relative isolate border-b border-border">
        <div aria-hidden className="glow pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className={`${wrap} grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24`}>
          <div>
            <p className="rise inline-flex items-center gap-2.5 border border-border bg-card/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
              <span aria-hidden className="pulse-ring inline-block h-2 w-2 rounded-full bg-accent" />
              From Ireland to the world · Free for founders
            </p>
            <h1 className="display rise mt-7 text-[46px] sm:text-6xl lg:text-[84px]" style={{ animationDelay: "70ms" }}>
              World-class products, <span className="text-brand">built in Ireland.</span>
            </h1>
            <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-foreground/75 sm:text-xl" style={{ animationDelay: "150ms" }}>
              From Ireland to the world. The verified network for founders building world-class products in Ireland, and the investors and partners everywhere who want to back them. Every member is checked by a person.
            </p>
            <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "230ms" }}>
              <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg", className: "group" })}>
                Apply to join
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="#how" className={buttonVariants({ variant: "outline", size: "lg" })}>How verification works</Link>
            </div>
            <ul className="rise mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground" style={{ animationDelay: "300ms" }}>
              {["Free", "Reviewed by hand", "Built in Ireland", "Investors worldwide"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>

          {/* floating product preview (desktop) */}
          <div className="relative hidden h-[580px] lg:block" aria-hidden>
            <p className="eyebrow absolute -top-8 right-0">Product preview · illustration</p>
            <div className="absolute left-0 top-16 w-[268px] -rotate-3 float-slow"><FeedMock /></div>
            <div className="absolute right-0 top-0 w-[252px] rotate-3"><MatchMock /></div>
            <div className="absolute bottom-0 right-4 w-[268px] -rotate-1"><LaunchMock /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden" aria-hidden>
            <FeedMock />
            <MatchMock />
            <p className="eyebrow sm:col-span-2">Product preview · illustration</p>
          </div>
        </div>

        {/* live ledger */}
        <dl className="mx-auto grid max-w-[1180px] grid-cols-3 border-t border-border" aria-label="The community in numbers">
          {ledger.map(([label, value], i) => (
            <div key={label} className={`px-5 py-6 sm:py-8 ${i < 2 ? "border-r border-border" : ""}`}>
              <dd className="display tabular text-4xl sm:text-6xl">{value}</dd>
              <dt className="eyebrow mt-2">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ============================================================ MARQUEE */}
      <section aria-label="Built in Ireland, seen worldwide" className="overflow-hidden border-b border-border py-6">
        <div className="marquee flex w-max items-center gap-10 whitespace-nowrap" aria-hidden>
          {[...CITIES, ...CITIES].map((c, i) => (
            <span key={`${c}-${i}`} className="flex items-center gap-10 font-display text-2xl font-semibold tracking-tight text-foreground/35 sm:text-3xl">
              {c}
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </section>

      {/* ============================================================ CONTRAST */}
      <section className={`${wrap} py-24 sm:py-32`} aria-labelledby="contrast">
        <Reveal>
          <p className="eyebrow">Why another network?</p>
          <h2 id="contrast" className="display mt-3 max-w-3xl text-4xl sm:text-6xl">Most networks are full of strangers.</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal className="border border-border bg-card/40 p-7 sm:p-9">
            <p className="eyebrow">Everywhere else</p>
            <ul className="mt-6 space-y-4">
              {OTHERS.map((t) => (
                <li key={t} className="flex gap-3 text-foreground/65"><X className="mt-0.5 h-5 w-5 shrink-0 text-foreground/35" aria-hidden />{t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="relative overflow-hidden border border-accent/40 bg-card p-7 shadow-[0_0_80px_-30px_hsl(var(--glow)/0.5)] sm:p-9">
            <div aria-hidden className="glow pointer-events-none absolute inset-0 opacity-70" />
            <p className="eyebrow !text-accent relative">Irish Founders</p>
            <ul className="relative mt-6 space-y-4">
              {OURS.map((t) => (
                <li key={t} className="flex gap-3"><Seal label="Verified" className="mt-0.5 h-5 w-5" />{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ VERIFICATION */}
      <section id="how" className="scroll-mt-20 border-y border-border bg-card/30 py-24 sm:py-32" aria-labelledby="how-title">
        <div className={`${wrap} grid gap-14 lg:grid-cols-12`}>
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">Membership</p>
              <h2 id="how-title" className="display mt-3 text-4xl sm:text-6xl">Slower than a signup form. <span className="text-brand">On purpose.</span></h2>
            </Reveal>
            <ol className="relative mt-14 space-y-10 border-l border-border pl-8">
              {STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 90} className="relative">
                  <span className="absolute -left-[45px] top-0 flex h-9 w-9 items-center justify-center rounded-full border border-accent/60 bg-background font-mono text-xs text-accent">{i + 1}</span>
                  <h3 className="font-display text-2xl font-semibold">{t}</h3>
                  <p className="mt-1.5 max-w-md text-foreground/70">{d}</p>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal delay={150} className="lg:col-span-5">
            <div className="sticky top-28 border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="eyebrow !text-foreground">What every entry passes</span>
                <span className="eyebrow">Illustration</span>
              </div>
              <ul>
                {CHECKS.map(([t, d], i) => (
                  <li key={t} className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0">
                    <span className="font-mono text-xs text-muted-foreground tabular">0{i + 1}</span>
                    <div className="flex-1"><p className="text-sm font-medium">{t}</p><p className="mt-0.5 text-[13px] text-muted-foreground">{d}</p></div>
                    <Seal label="Checked by a person" />
                  </li>
                ))}
              </ul>
              <p className="border-t border-border bg-muted/40 px-5 py-3 font-mono text-[11px] text-muted-foreground">Reviewed by a person. Never by a script.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ PRODUCT BENTO */}
      <section className={`${wrap} py-24 sm:py-32`} aria-labelledby="product">
        <Reveal>
          <p className="eyebrow">Inside</p>
          <h2 id="product" className="display mt-3 max-w-3xl text-4xl sm:text-6xl">Everything a founder network should have.</h2>
          <p className="mt-5 max-w-xl text-lg text-foreground/70">The rhythm of Instagram, the credibility of LinkedIn, the discovery of a founder matchmaker. Only for people we have checked.</p>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <Reveal className="panel overflow-hidden p-7 lg:col-span-5 lg:row-span-2">
            <p className="eyebrow !text-accent">Stories</p>
            <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">Share the day-to-day, for 24 hours.</h3>
            <p className="mt-3 text-foreground/70">Quick updates from founders you follow. Milestones, hiring calls, what you are looking for. Gone tomorrow.</p>
            <div className="mt-8 flex justify-center"><StoryMock /></div>
          </Reveal>

          <Reveal delay={90} className="panel p-7 lg:col-span-7">
            <p className="eyebrow !text-accent">Discover</p>
            <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">Matches that explain themselves.</h3>
            <p className="mt-3 max-w-lg text-foreground/70">Find co-founders, mentors, hires and design partners. Every suggestion shows exactly why it matched. No black box.</p>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <MatchMock />
              <div className="hidden flex-col justify-center gap-2 sm:flex">
                {["Wants a mentor", "Offers co-founding", "Both in FinTech", "Shared: react"].map((c) => (
                  <span key={c} className="w-fit border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-accent">{c}</span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={90} className="panel p-7 lg:col-span-7">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_250px]">
              <div>
                <p className="eyebrow !text-accent">Launch Day</p>
                <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">Launch to people who will actually try it.</h3>
                <p className="mt-3 text-foreground/70">A daily board ranked by support with a freshness boost, and a Launch of the Day. Real feedback from verified founders.</p>
              </div>
              <LaunchMock />
            </div>
          </Reveal>

          <Reveal className="panel p-7 lg:col-span-5">
            <p className="eyebrow !text-accent">Profiles</p>
            <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">A profile that shows the work.</h3>
            <p className="mt-3 text-foreground/70">Cover, milestones, launches and posts in a clean grid. What you are looking for, and what you can offer.</p>
            <div className="mt-6"><ProfileGridMock /></div>
          </Reveal>

          <div className="grid gap-5 lg:col-span-7">
            <Reveal delay={90} className="panel p-7">
              <p className="eyebrow !text-accent">Investor introductions</p>
              <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">Consent first. Always.</h3>
              <p className="mt-3 text-foreground/70">Verified investors can ask to be introduced. A private conversation opens only if you accept.</p>
              <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
                {["Request", "You accept", "Chat opens"].map((t, i) => (
                  <span key={t} className="flex items-center gap-2">
                    <span className={`border px-2.5 py-1.5 ${i === 2 ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{t}</span>
                    {i < 2 ? <span aria-hidden className="text-muted-foreground">→</span> : null}
                  </span>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150} className="panel p-7">
              <p className="eyebrow !text-accent">Design partners</p>
              <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">Find your first real users.</h3>
              <p className="mt-3 text-foreground/70">Ask for testers, review who is interested, accept the right ones and keep the conversation going.</p>
              <div className="mt-6">
                <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground"><span>Partners found</span><span>3 of 5</span></div>
                <div className="mt-2 h-2 bg-muted"><div className="h-full w-3/5 bg-accent" /></div>
                <div className="mt-4 flex -space-x-2">{[0, 1, 2].map((i) => <Dot key={i} className="h-8 w-8 border-2 border-card" />)}</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ ROLES */}
      <section className="border-y border-border py-24 sm:py-32" aria-labelledby="roles">
        <div className={wrap}>
          <Reveal>
            <p className="eyebrow">Who it is for</p>
            <h2 id="roles" className="display mt-3 max-w-3xl text-4xl sm:text-6xl">Built here. Open to the world.</h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-border lg:grid-cols-3">
            {ROLES.map(([title, line, items], i) => (
              <Reveal key={title} delay={i * 90} className="bg-background p-7 sm:p-9">
                <p className="eyebrow !text-accent">0{i + 1}</p>
                <h3 className="mt-3 font-display text-4xl font-semibold">{title}</h3>
                <p className="mt-2 text-foreground/70">{line}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {items.map((t) => <li key={t} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t}</li>)}
                </ul>
                <Link href="/signup" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">Apply as {title === "Ecosystem partners" ? "a partner" : title.slice(0, -1).toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ REGISTER */}
      <section className={`${wrap} py-24 sm:py-32`} aria-labelledby="register">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">The register</p>
            <h2 id="register" className="display mt-3 text-4xl sm:text-6xl">Verified startups</h2>
          </div>
          <Link href="/startups" className="text-sm font-medium text-accent hover:underline">All startups →</Link>
        </Reveal>
        {startups && startups.length > 0 ? (
          <ol className="border-t border-border">
            {startups.map((st, i) => (
              <li key={st.id} className="border-b border-border">
                <Link href={`/startups/${st.slug}`} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-5 transition-colors hover:bg-card sm:grid-cols-[3rem_1fr_12rem_9rem_auto]">
                  <span className="font-mono text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-2xl font-semibold">{st.name}</span>
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
            description="Every company listed here is checked by hand. The first founders are being reviewed now. Apply to be one of them."
            action={<Link href="/signup" className={buttonVariants({ variant: "accent" })}>Apply to join</Link>}
          />
        )}
      </section>

      {/* ============================================================ TRUST */}
      <section className="border-t border-border bg-card/30 py-24 sm:py-32" aria-labelledby="trust">
        <div className={`${wrap} grid gap-14 lg:grid-cols-12`}>
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">Trust</p>
            <h2 id="trust" className="display mt-3 text-4xl sm:text-5xl">Built to be trusted.</h2>
          </Reveal>
          <dl className="grid gap-px bg-border sm:grid-cols-2 lg:col-span-8">
            {TRUST.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80} className="bg-background p-7">
                <dt className="font-display text-2xl font-semibold">{t}</dt>
                <dd className="mt-2 text-foreground/70">{d}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================================================ FAQ */}
      <section className={`${wrap} grid gap-12 py-24 sm:py-32 lg:grid-cols-12`} aria-labelledby="faq">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">Questions</p>
          <h2 id="faq" className="display mt-3 text-4xl sm:text-5xl">Straight answers.</h2>
        </Reveal>
        <div className="border-t border-border lg:col-span-8">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-border py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="font-mono text-xl text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-foreground/70">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============================================================ CLOSING CTA */}
      <section className="relative isolate overflow-hidden border-t border-border" aria-labelledby="cta">
        <div aria-hidden className="glow pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div className={`${wrap} flex flex-col items-center py-28 text-center sm:py-36`}>
          <Reveal>
            <Image src="/brand/lockup-900-t.png" alt="Irish Founders" width={900} height={448} sizes="(min-width: 640px) 320px, 240px" className="dark-only mx-auto h-auto w-60 sm:w-80" />
            <Image src="/brand/lockup-900.png" alt="Irish Founders" width={900} height={448} sizes="(min-width: 640px) 320px, 240px" className="light-only mx-auto h-auto w-60 rounded-3xl sm:w-80" />
          </Reveal>
          <Reveal delay={100}>
            <h2 id="cta" className="display mx-auto mt-10 max-w-3xl text-4xl sm:text-6xl">Building in Ireland for the world? <span className="text-brand">Come and be checked.</span></h2>
          </Reveal>
          <Reveal delay={180} className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg", className: "group" })}>
              Apply to join <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Free · Reviewed by hand</span>
          </Reveal>
        </div>
      </section>
    </>
  );
}
