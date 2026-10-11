import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
    <span aria-hidden className="inline-block h-6 w-6 rounded-md bg-accent" />
    Irish Founders
  </Link>
);

const NAV = [
  { href: "/startups", label: "Discover Startups" },
  { href: "/launches", label: "Product Launches" },
  { href: "/about", label: "About" },
];

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-muted-foreground hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href={homeFor(session)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {session.verification_status === "approved" ? "Open app" : "My application"}
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">Sign out</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
              <Link href="/signup" className={buttonVariants({ variant: "accent", size: "sm" })}>Apply to join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
