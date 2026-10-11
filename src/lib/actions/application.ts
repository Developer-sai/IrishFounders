"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  describeDbError, fail, ok, type ActionResult,
} from "@/lib/actions/result";
import {
  founderApplicationSchema, infoResponseSchema, investorApplicationSchema, partnerApplicationSchema,
} from "@/lib/validations/application";
import type { Json } from "@/lib/supabase/database.types";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) (out[issue.path.join(".")] ??= []).push(issue.message);
  return out;
}

const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

async function saveEvidence(applicationId: string, userId: string, paths: string[]) {
  const safe = paths.filter((p) => p.startsWith(`${userId}/`) && !p.includes(".."));
  if (!safe.length) return;
  const supabase = await createClient();
  await supabase.from("verification_evidence").insert(
    safe.map((storage_path) => ({ application_id: applicationId, uploaded_by: userId, storage_path })),
  );
}

export async function checkCompany(website: string, linkedin: string) {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_company", { p_website: website, p_linkedin: linkedin });
  if (error) return null;
  return data as unknown as {
    normalized_domain: string;
    startup: { id: string; name: string; slug: string } | null;
    pending_application: boolean;
  };
}

/** Founder application (client wizard calls this with a plain object). */
export async function submitFounderApplication(
  input: unknown,
  evidencePaths: string[] = [],
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = founderApplicationSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { profile, interview, ...rest } = parsed.data;
  const { data, error } = await supabase.rpc("submit_application", {
    p: { applicant_type: "founder", profile, interview, ...rest, founder_role: profile.headline } as unknown as Json,
  });
  if (error) return fail(describeDbError(error));
  await saveEvidence(data as string, user.id, evidencePaths);
  revalidatePath("/application/status");
  return ok();
}

export async function submitInvestorApplication(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const parsed = investorApplicationSchema.safeParse({
    profile: {
      full_name: formData.get("full_name"),
      linkedin_url: formData.get("linkedin_url"),
      location: formData.get("location"),
      headline: formData.get("headline"),
    },
    organisation_name: formData.get("organisation_name") ?? "",
    organisation_website: formData.get("organisation_website") ?? "",
    investor: {
      investor_category: formData.get("investor_category"),
      professional_background: formData.get("professional_background"),
      investment_sectors: lines(formData.get("investment_sectors")),
      preferred_stages: formData.getAll("preferred_stages"),
      geographic_preferences: lines(formData.get("geographic_preferences")),
      public_portfolio_links: lines(formData.get("public_portfolio_links")),
      disclaimer_accepted: formData.get("disclaimer_accepted") === "on",
    },
    interview: {
      background: formData.get("q_background"),
      interests: formData.get("q_interests"),
      value: formData.get("q_value"),
      why: formData.get("q_why"),
    },
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { profile, interview, investor, organisation_name, organisation_website } = parsed.data;
  const { error } = await supabase.rpc("submit_application", {
    p: { applicant_type: "investor", profile, interview, investor, organisation_name, organisation_website } as unknown as Json,
  });
  if (error) return fail(describeDbError(error));
  revalidatePath("/application/status");
  redirect("/application/status");
}

export async function submitPartnerApplication(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const parsed = partnerApplicationSchema.safeParse({
    profile: {
      full_name: formData.get("full_name"),
      linkedin_url: formData.get("linkedin_url"),
      location: formData.get("location"),
      headline: formData.get("headline"),
    },
    organisation_name: formData.get("organisation_name"),
    organisation_website: formData.get("organisation_website"),
    partner: { organisation_type: formData.get("organisation_type") },
    interview: {
      about: formData.get("q_about"),
      offer: formData.get("q_offer"),
      why: formData.get("q_why"),
    },
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { profile, interview, partner, organisation_name, organisation_website } = parsed.data;
  const { error } = await supabase.rpc("submit_application", {
    p: { applicant_type: "partner", profile, interview, partner, organisation_name, organisation_website } as unknown as Json,
  });
  if (error) return fail(describeDbError(error));
  revalidatePath("/application/status");
  redirect("/application/status");
}

export async function respondToInfoRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const applicationId = String(formData.get("application_id") ?? "");
  const rawFollowers = String(formData.get("linkedin_follower_count") ?? "");
  const posts = lines(formData.get("sample_post_urls"));
  const parsed = infoResponseSchema.safeParse({
    linkedin_follower_count: rawFollowers === "" ? undefined : rawFollowers,
    sample_post_urls: posts.length ? posts : undefined,
    relationship_to_company: String(formData.get("relationship_to_company") ?? "") || undefined,
  });
  if (!parsed.success) return fail("Please check the values you entered.", fieldErrors(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_info_request", {
    p_app: applicationId,
    p: parsed.data as unknown as Json,
  });
  if (error) return fail(describeDbError(error));
  revalidatePath("/application/status");
  return ok();
}
