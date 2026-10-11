import Link from "next/link";
import { Logo } from "@/components/marketing/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">{children}</div>
      <Link href="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
    </main>
  );
}
