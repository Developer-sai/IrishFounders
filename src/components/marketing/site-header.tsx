import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { CommandPalette } from "@/components/ui/command-palette";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/brand/logo";

export { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/startups", label: "The register" },
  { href: "/launches", label: "Launches" },
  { href: "/about", label: "How it works" },
];

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
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
