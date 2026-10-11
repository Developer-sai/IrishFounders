import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Apply to join" };

export default function SignupPage() {
  return (
    <>
      <p className="eyebrow">Step 1 of your application</p>
      <h1 className="display mt-2 text-4xl">Create your account</h1>
      <p className="mb-8 mt-3 text-sm text-muted-foreground">
        Step one of your application. You&apos;ll confirm your email, then tell us about your company.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-foreground">Sign in</Link>
      </p>
    </>
  );
}
