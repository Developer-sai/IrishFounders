"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getSession, homeFor } from "@/lib/auth";
import { loginSchema, signupSchema, emailSchema, resetSchema } from "@/lib/validations/auth";
import { fail, ok, type ActionResult } from "@/lib/actions/result";

/** Only allow same-site relative redirects (prevents open redirects). */
export async function safeNext(next: unknown): Promise<string | null> {
  if (typeof next !== "string") return null;
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
}

function flatten(err: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const fe = err.flatten().fieldErrors;
  return Object.fromEntries(Object.entries(fe).filter(([, v]) => v?.length)) as Record<string, string[]>;
}

export async function signUp(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", flatten(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.siteUrl()}/auth/callback?next=/application/status`,
    },
  });
  if (error) {
    if (error.status === 429) return fail("Too many attempts. Please wait a moment and try again.");
    // Do not reveal whether an email is already registered.
    if (!/already|registered/i.test(error.message)) return fail(error.message);
  }
  return ok();
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return fail("Please fix the highlighted fields.", flatten(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (/confirm/i.test(error.message)) return fail("Please confirm your email address first. Check your inbox.");
    return fail("Incorrect email or password.");
  }
  const next = await safeNext(formData.get("next"));
  const session = await getSession();
  redirect(next ?? (session ? homeFor(session) : "/dashboard"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return fail("Enter a valid email address.");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Always succeed: never reveal which emails exist.
  return ok();
}

export async function updatePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return fail("Use at least 10 characters.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(error.message);
  redirect("/dashboard");
}
