import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AuthNav } from "@/components/marketing/auth-nav";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/startups", label: "The register" },
  { href: "/launches", label: "Launches" },
  { href: "/about", label: "How it works" },
];

/** Static header: no cookies are read on the server, so pages using it can be prerendered. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-5">
        <Logo priority />
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-foreground/70 underline-offset-[6px] transition-colors hover:text-foreground hover:underline">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <CommandPalette links={NAV} className="hidden sm:inline-flex" />
          <ThemeToggle />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
