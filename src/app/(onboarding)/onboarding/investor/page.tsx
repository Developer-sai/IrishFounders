import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/card";
import { SimpleApplicationForm } from "@/components/onboarding/simple-application-form";
import { submitInvestorApplication } from "@/lib/actions/application";
import { INTERVIEW_QUESTIONS_INVESTOR } from "@/lib/validations/application";

export const metadata: Metadata = { title: "Investor application" };

export default async function InvestorOnboardingPage() {
  const session = await requireUser();
  if (session.role !== "public_visitor" || !["unverified", "rejected"].includes(session.verification_status)) redirect("/application/status");
  return (
    <>
      <PageHeader title="Investor application" description="Investors are manually verified before they can discover founders." />
      <SimpleApplicationForm
        kind="investor"
        action={submitInvestorApplication}
        defaultName={session.full_name}
        questions={INTERVIEW_QUESTIONS_INVESTOR}
      />
    </>
  );
}
