import Link from "next/link";
import { ShieldCheck, Users, Rocket, Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, EmptyState, Badge } from "@/components/ui/card";
import { StartupCard } from "@/components/startups/startup-card";

const STEPS = [
  { title: "Apply", body: "Tell us about yourself and your company. It takes about ten minutes." },
  { title: "Verification", body: "We manually review your company website, LinkedIn page and activity. Nothing is auto-approved." },
  { title: "Short interview", body: "A brief written interview so the community knows who is joining." },
  { title: "Join", body: "Approved members get access to the founder community, launches and introductions." },
];

const FAQ = [
  ["Is it free?", "Yes. Membership is completely free for founders. There are no tiers or hidden charges."],
  ["Who can join?", "Founders with a genuine company, investors, and approved ecosystem partners across Ireland."],
  ["What do you verify?", "A real company website, a company LinkedIn page with 50+ followers and recent posts, your link to the company, and a short interview. Verification is done manually by our team."],
  ["Does a verified badge mean an investment guarantee?", "No. Badges confirm what our team reviewed. They are not financial advice or a guarantee of capacity or commitment."],
];

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: stats }, { data: startups }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase
      .from("startups")
      .select("id, name, slug, logo_url, industry, stage, short_description, location")
      .eq("is_verified", true)
      .eq("is_demo", false)
      .order("verified_at", { ascending: false })
      .limit(6),
  ]);
  const s = (stats ?? {}) as { verified_startups?: number; approved_founders?: number; launches?: number };

  return (
    <>
      <section className="py-20 text-center md:py-28">
        <Badge tone="success" className="mb-6">Verified · Free · Invitation by approval</Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Where Ireland&apos;s Founders Build Together.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A verified community connecting founders, startups, investors, and builders across Ireland. Discover
          ambitious companies, find your first users, meet collaborators, and grow together.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg" })}>Apply to Join</Link>
          <Link href="/startups" className={buttonVariants({ variant: "outline", size: "lg" })}>Explore Startups</Link>
        </div>
        <dl className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-4">
          {[
            ["Verified startups", s.verified_startups ?? 0],
            ["Verified founders", s.approved_founders ?? 0],
            ["Product launches", s.launches ?? 0],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-border bg-card p-4">
              <dd className="text-2xl font-semibold">{value as number}</dd>
              <dt className="text-xs text-muted-foreground">{label as string}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-12" aria-labelledby="featured">
        <h2 id="featured" className="mb-6 text-2xl font-semibold tracking-tight">Featured verified startups</h2>
        {startups && startups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((st) => <StartupCard key={st.id} startup={st} />)}
          </div>
        ) : (
          <EmptyState
            title="The community is just getting started"
            description="Every company listed here is manually verified. The first founders are being reviewed now — apply to be among them."
            action={<Link href="/signup" className={buttonVariants({ variant: "accent" })}>Apply to join</Link>}
          />
        )}
      </section>

      <section className="py-12" aria-labelledby="how">
        <h2 id="how" className="mb-6 text-2xl font-semibold tracking-tight">How membership works</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent>
                  <span className="text-sm font-medium text-accent">Step {i + 1}</span>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 py-12 md:grid-cols-4" aria-label="Benefits">
        {[
          [ShieldCheck, "Real people, real companies", "Every member is verified by a human."],
          [Users, "Founder community", "Share progress, ask questions, find collaborators."],
          [Rocket, "Launch & find users", "Launch products and recruit design partners."],
          [Handshake, "Investor introductions", "Verified investors, consent-based introductions."],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof ShieldCheck;
          return (
            <Card key={title as string}>
              <CardContent>
                <I className="mb-3 h-5 w-5 text-accent" aria-hidden />
                <h3 className="font-semibold">{title as string}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body as string}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="py-12" aria-labelledby="faq">
        <h2 id="faq" className="mb-6 text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="text-2xl font-semibold">Building something in Ireland?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm opacity-80">Apply today. Applications are reviewed by hand.</p>
        <Link href="/signup" className={buttonVariants({ variant: "accent", size: "lg", className: "mt-6" })}>
          Apply to Join
        </Link>
      </section>
    </>
  );
}
