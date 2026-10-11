import Link from "next/link";
import { Logo } from "./site-header";

const col = "block py-1 text-sm text-foreground/70 transition-colors hover:text-foreground";

export function SiteFooter({ className = "mt-32" }: { className?: string }) {
  return (
    <footer className={`${className} border-t border-border`}>
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm font-display text-xl leading-snug">
            World-class products, from Ireland to the world. A trusted home for the founders building them.
          </p>
        </div>
        <nav aria-label="Platform">
          <p className="eyebrow mb-3">Platform</p>
          <Link className={col} href="/startups">The register</Link>
          <Link className={col} href="/launches">Product launches</Link>
          <Link className={col} href="/about">How it works</Link>
          <Link className={col} href="/signup">Apply to join</Link>
        </nav>
        <nav aria-label="Legal">
          <p className="eyebrow mb-3">Legal</p>
          <Link className={col} href="/privacy">Privacy policy</Link>
          <Link className={col} href="/terms">Terms of service</Link>
          <Link className={col} href="/guidelines">Community guidelines</Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-[1120px] px-5 py-6 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Irish Founders is independent and is not affiliated with or endorsed by any government agency or startup
          organisation. It facilitates professional networking and introductions only, and does not provide financial or
          investment advice or arrange investment transactions.
        </p>
      </div>
    </footer>
  );
}
