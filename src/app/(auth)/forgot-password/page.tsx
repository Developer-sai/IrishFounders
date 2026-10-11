import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/form-controls";
import { requestPasswordReset } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">We&apos;ll email you a link to choose a new password.</p>
      <ActionForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        successMessage="If an account exists for that email, a reset link is on its way."
        buttonProps={{ className: "w-full" }}
      >
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </ActionForm>
    </>
  );
}
