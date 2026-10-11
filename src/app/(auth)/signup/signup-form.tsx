"use client";

import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { SubmitButton, fieldError } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/form-controls";

export function SignupForm() {
  const [state, action] = useActionState(signUp, null);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-md bg-accent/10 p-4 text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-muted-foreground">
          We&apos;ve sent a confirmation link. Click it to verify your email and continue your application.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Full name" htmlFor="fullName" error={fieldError(state, "fullName")}>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" error={fieldError(state, "email")}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 10 characters." error={fieldError(state, "password")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      {state && !state.ok ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to our <Link2 href="/terms">Terms</Link2> and <Link2 href="/privacy">Privacy Policy</Link2>.
      </p>
    </form>
  );
}

function Link2({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="underline" target="_blank" rel="noreferrer">{children}</a>;
}
