import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function Forbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-destructive">403</p>
      <h1 className="text-3xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="text-muted-foreground">This area is restricted to members with the right permissions.</p>
      <Link href="/" className={buttonVariants({})}>Back to home</Link>
    </main>
  );
}
