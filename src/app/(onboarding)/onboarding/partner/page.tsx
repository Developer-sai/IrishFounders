import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/card";
import { SimpleApplicationForm } from "@/components/onboarding/simple-application-form";
import { submitPartnerApplication } from "@/lib/actions/application";
import { INTERVIEW_QUESTIONS_PARTNER } from "@/lib/validations/application";

export const metadata: Metadata = { title: "Ecosystem partner application" };

export default async function PartnerOnboardingPage() {
  const session = await requireUser();
  if (session.role !== "public_visitor" || !["unverified", "rejected"].includes(session.verification_status)) redirect("/application/status");
  return (
    <>
      <PageHeader title="Ecosystem partner application" description="For accelerators, incubators, universities and supporting organisations." />
      <SimpleApplicationForm
        kind="partner"
        action={submitPartnerApplication}
        defaultName={session.full_name}
        questions={INTERVIEW_QUESTIONS_PARTNER}
      />
    </>
  );
}
