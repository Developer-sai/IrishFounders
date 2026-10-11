/**
 * Illustrative product mock-ups for the landing page. Everything here is placeholder UI
 * ("Founder name", "Your startup"): no real or invented members are shown.
 */
import { Seal } from "@/components/ui/card";

export const Dot = ({ className = "h-9 w-9" }: { className?: string }) => (
  <span aria-hidden className={`inline-block shrink-0 rounded-full bg-gradient-to-br from-accent/90 to-verified/25 ${className}`} />
);

function Ring({ unseen = true }: { unseen?: boolean }) {
  return (
    <span aria-hidden className={`inline-flex rounded-full border-2 p-[2px] ${unseen ? "border-accent" : "border-foreground/25"}`}>
      <span className="inline-flex rounded-full border-2 border-background">
        <Dot className="h-11 w-11" />
      </span>
    </span>
  );
}

/** Mock window chrome */
export function Window({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden border border-border bg-card shadow-[0_18px_44px_-22px_hsl(var(--glow)/0.4)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-foreground/20" />
        <span className="h-2 w-2 rounded-full bg-foreground/20" />
        <span className="h-2 w-2 rounded-full bg-foreground/20" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function FeedMock() {
  return (
    <Window title="Home">
      <div className="p-4">
        <div className="mb-4 flex gap-3">
          {[true, true, false, true].map((u, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Ring unseen={u} />
              <span className="h-1.5 w-8 rounded bg-foreground/15" />
            </div>
          ))}
        </div>
        <div className="border border-border p-3">
          <div className="flex items-center gap-2.5">
            <Dot className="h-8 w-8" />
            <div>
              <p className="text-[13px] font-medium leading-none">Founder name</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">Your startup · today</p>
            </div>
            <span className="ml-auto">
              <Seal label="Verified" className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed">
            Shipped v1 to our first 20 users this week. The one thing that worked: asking every pilot customer a hard question on day three.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-0.5">
            <div className="aspect-[4/3] bg-muted" />
            <div className="aspect-[4/3] bg-muted/60" />
          </div>
          <div className="mt-3 flex gap-4 font-mono text-[11px] text-muted-foreground">
            <span>♥ 24</span>
            <span>6 replies</span>
          </div>
        </div>
      </div>
    </Window>
  );
}

export function MatchMock() {
  return (
    <Window title="Discover">
      <div className="p-4">
        <p className="eyebrow mb-3">Match 1 of 5</p>
        <div className="flex items-center gap-3">
          <Dot className="h-14 w-14" />
          <div>
            <p className="font-display text-xl font-semibold leading-none">Founder name</p>
            <p className="mt-1 text-[12px] text-muted-foreground">CTO · Your startup · Cork</p>
          </div>
        </div>
        <p className="eyebrow mb-2 mt-4">Why you match</p>
        <ul className="space-y-1.5 text-[12px]">
          {["You want a co-founder · they offer it", "Both in FinTech", "Shared skills: react, design"].map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <span className="border border-border px-3 py-1.5 text-[12px]">Pass</span>
          <span className="ml-auto bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground">Connect</span>
        </div>
      </div>
    </Window>
  );
}

export function LaunchMock() {
  return (
    <Window title="Launch Day">
      <div className="p-4">
        <div className="mb-3 bg-primary p-3 text-primary-foreground">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-70">★ Launch of the day</p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight">Your product</p>
          <p className="text-[11px] opacity-75">One line that says what it does</p>
        </div>
        {[2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3 border-t border-border py-2">
            <span className="w-4 font-display text-lg text-muted-foreground">{n}</span>
            <div className="flex-1">
              <span className="block h-2 w-24 rounded bg-foreground/25" />
              <span className="mt-1.5 block h-1.5 w-36 rounded bg-foreground/10" />
            </div>
            <span className="border border-border px-2 py-1 font-mono text-[10px]">▲ {20 - n * 3}</span>
          </div>
        ))}
      </div>
    </Window>
  );
}

export function ProfileGridMock() {
  const tiles = ["text", "img", "launch", "img", "text", "text"];
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {tiles.map((t, i) => (
        <div
          key={i}
          className={`aspect-square p-2 ${t === "img" ? "bg-gradient-to-br from-accent/35 to-muted" : t === "launch" ? "bg-primary" : "border border-border bg-card"}`}
        >
          {t === "text" ? (
            <>
              <span className="block h-1.5 w-3/4 rounded bg-foreground/30" />
              <span className="mt-1.5 block h-1.5 w-1/2 rounded bg-foreground/15" />
            </>
          ) : null}
          {t === "launch" ? <span className="block h-1.5 w-2/3 rounded bg-primary-foreground/60" /> : null}
        </div>
      ))}
    </div>
  );
}

export function StoryMock() {
  return (
    <div className="mx-auto w-full max-w-[290px]">
      <div className="relative aspect-[9/16] overflow-hidden border border-border bg-gradient-to-b from-muted to-background p-3">
        <div className="flex gap-1">
          {[1, 1, 0.5, 0].map((p, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/20">
              <span className="block h-full bg-foreground" style={{ width: `${p * 100}%` }} />
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Dot className="h-7 w-7" />
          <span className="text-[11px] font-medium">Founder name</span>
          <span className="font-mono text-[9px] text-muted-foreground">2h</span>
        </div>
        <p className="display absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-2xl">We just closed our first pilot customer.</p>
        <span className="absolute bottom-3 left-3 border border-foreground/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">Milestone</span>
      </div>
    </div>
  );
}
