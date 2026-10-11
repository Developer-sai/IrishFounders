import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FounderWizard } from "@/components/onboarding/founder-wizard";
import { PageHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Founder application" };

export default async function FounderOnboardingPage() {
  const session = await requireUser();
  if (session.role !== "public_visitor") redirect("/application/status");

  const supabase = await createClient();
  const { count } = await supabase
    .from("membership_applications")
    .select("id", { count: "exact", head: true })
    .not("status", "in", "(rejected,suspended)");
  if ((count ?? 0) > 0) redirect("/application/status");

  return (
    <>
      <PageHeader title="Founder application" description="Tell us about you and your company. Every application is reviewed by a person." />
      <FounderWizard userId={session.id} defaultName={session.full_name} />
    </>
  );
}
