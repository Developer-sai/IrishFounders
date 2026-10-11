import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/form-controls";
import { updatePassword } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  if (!(await getSession())) redirect("/login");
  return (
    <>
      <h1 className="display text-4xl">Choose a new password</h1>
      <div className="mt-6">
        <ActionForm action={updatePassword} submitLabel="Update password" buttonProps={{ className: "w-full" }}>
          <Field label="New password" htmlFor="password" hint="At least 10 characters.">
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
          </Field>
        </ActionForm>
      </div>
    </>
  );
}
