import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** A Georgian fanlight: the arch over a Dublin door, in door red. */
export function Mark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 21V12a9 9 0 0 1 18 0v9z" fill="hsl(var(--accent))" />
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" stroke="hsl(var(--background))" strokeWidth="1.1" opacity=".85" />
    </svg>
  );
}

export const Logo = () => (
  <Link href="/" className="group flex items-center gap-2.5" aria-label="Irish Founders, home">
    <Mark />
    <span className="whitespace-nowrap font-display text-[19px] leading-none tracking-tight" style={{ fontVariationSettings: '"opsz" 72, "SOFT" 50' }}>
      Irish Founders
    </span>
  </Link>
);

const NAV = [
  { href: "/startups", label: "The register" },
  { href: "/launches", label: "Launches" },
  { href: "/about", label: "How it works" },
];

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-5">
        <Logo />
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
          {session ? (
            <>
              <Link href={homeFor(session)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {session.verification_status === "approved" ? "Open workspace" : "My application"}
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">Sign out</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
              <Link href="/signup" className={buttonVariants({ variant: "accent", size: "sm" })}>Apply</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
