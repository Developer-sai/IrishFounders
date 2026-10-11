"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

export type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: { children: React.ReactNode; pendingLabel?: string; className?: string } & VariantProps<typeof buttonVariants>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
  );
}

/** A <form> bound to a server action that returns an ActionResult. Shows errors and success inline. */
export function ActionForm({
  action,
  children,
  submitLabel,
  successMessage,
  resetOnSuccess = false,
  className,
  buttonProps,
}: {
  action: FormAction;
  children: React.ReactNode;
  submitLabel: string;
  successMessage?: string;
  resetOnSuccess?: boolean;
  className?: string;
  buttonProps?: VariantProps<typeof buttonVariants> & { className?: string };
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state && !state.ok ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok && successMessage ? (
        <p role="status" className="rounded-md bg-verified/10 px-3 py-2 text-sm text-verified">
          {successMessage}
        </p>
      ) : null}
      <SubmitButton {...buttonProps}>{submitLabel}</SubmitButton>
    </form>
  );
}

/** Field-level error lookup helper for ActionForm consumers. */
export function fieldError(state: ActionResult | null, name: string): string | undefined {
  return state && !state.ok ? state.fieldErrors?.[name]?.[0] : undefined;
}

/** One-button form for row actions (approve, accept, delete…). */
export function ActionButton({
  action,
  label,
  hidden,
  ...props
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  hidden?: Record<string, string>;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <form action={action} className="inline">
      {hidden
        ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      <SubmitButton {...props}>{label}</SubmitButton>
    </form>
  );
}
