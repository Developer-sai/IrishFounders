import { Logo } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session.email}</span>
            <Button type="submit" variant="ghost" size="sm">Sign out</Button>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}
