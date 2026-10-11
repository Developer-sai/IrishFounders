import Link from "next/link";
import { Logo } from "@/components/marketing/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 text-[hsl(41_30%_93%)] lg:flex">
        <div className="[&_a]:text-[hsl(41_30%_93%)]"><Logo /></div>
        <div>
          <p className="display max-w-md text-5xl">A guest book you have to be <em className="italic text-accent">vouched into.</em></p>
          <p className="mt-6 max-w-sm text-sm text-[hsl(41_30%_93%/0.65)]">
            Every member is checked by a person: their company, their LinkedIn page, a short interview. That is why you can trust who you meet.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[hsl(41_30%_93%/0.45)]">Dublin · Free · Reviewed by hand</p>
      </aside>
      <main id="main" className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo /></div>
          {children}
          <Link href="/" className="mt-10 inline-block font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
