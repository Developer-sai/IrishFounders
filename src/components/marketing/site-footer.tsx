import Link from "next/link";
import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            An independent, curated community connecting verified founders, startups, investors and
            ecosystem partners across Ireland.
          </p>
        </div>
        <nav aria-label="Platform" className="space-y-2 text-sm">
          <p className="font-medium">Platform</p>
          <Link className="block text-muted-foreground hover:text-foreground" href="/startups">Startups</Link>
          <Link className="block text-muted-foreground hover:text-foreground" href="/launches">Product launches</Link>
          <Link className="block text-muted-foreground hover:text-foreground" href="/signup">Apply to join</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2 text-sm">
          <p className="font-medium">Legal</p>
          <Link className="block text-muted-foreground hover:text-foreground" href="/privacy">Privacy policy</Link>
          <Link className="block text-muted-foreground hover:text-foreground" href="/terms">Terms of service</Link>
          <Link className="block text-muted-foreground hover:text-foreground" href="/guidelines">Community guidelines</Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Irish Founders operates independently and is not affiliated with or endorsed by any government agency or
        startup organisation. The platform facilitates professional networking and introductions. It does not provide
        financial or investment advice or arrange investment transactions.
      </div>
    </footer>
  );
}
