import Link from "next/link";
import { Logo } from "@/components/marketing/site-header";
import { GlobeLoader } from "@/components/landing/globe-loader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 text-[hsl(150_20%_96%)] lg:flex">
        <Logo onDark size={36} />
        <div className="mx-auto w-full max-w-[300px]" aria-hidden><GlobeLoader markers={[]} priority={false} /></div>
        <div>
          <p className="display max-w-md text-5xl">From idea to startup, <span className="text-brand">with people who are real.</span></p>
          <p className="mt-6 max-w-sm text-sm text-[hsl(150_20%_96%/0.65)]">
            Every member is checked by a person: their company, their LinkedIn page, a short interview. Founders building in Ireland, investors from anywhere.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[hsl(150_20%_96%/0.45)]">Built in Ireland · Backed worldwide · Reviewed by hand</p>
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
