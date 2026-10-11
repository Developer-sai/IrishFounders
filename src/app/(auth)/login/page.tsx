import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/form-controls";
import { resendConfirmation, signIn } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; notice?: string }> }) {
  const { next, error, notice } = await searchParams;
  return (
    <>
      <p className="eyebrow">Members</p>
      <h1 className="display mt-2 text-4xl">Sign in</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">Welcome back to Irish Founders.</p>
      {notice === "link_used" ? (
        <p role="status" className="mb-4 rounded-md bg-verified/10 px-3 py-2 text-sm">
          If you just confirmed your email, you&apos;re all set: sign in below. If the link didn&apos;t work, it may have already been used. Request a new one at the bottom of this page.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          That link is invalid or has expired. Sign in, or request a new confirmation email below.
        </p>
      ) : null}
      <ActionForm action={signIn} submitLabel="Sign in" buttonProps={{ className: "w-full" }}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
      </ActionForm>
      <div className="mt-6 flex justify-between text-sm text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
        <Link href="/signup" className="hover:text-foreground">Apply to join</Link>
      </div>
      <details className="mt-8 border-t border-border pt-4 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Didn&apos;t get a confirmation email?</summary>
        <div className="mt-3">
          <ActionForm action={resendConfirmation} submitLabel="Resend confirmation email" successMessage="If that address has an unconfirmed account, a new link is on its way. Check spam too." buttonProps={{ size: "sm", variant: "outline" }}>
            <Field label="Address you signed up with" htmlFor="resend-email"><Input id="resend-email" name="email" type="email" autoComplete="email" required /></Field>
          </ActionForm>
        </div>
      </details>
    </>
  );
}
