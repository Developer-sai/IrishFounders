"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { describeDbError } from "@/lib/actions/result";

const uuid = z.string().uuid();

function entries(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

function back(path: string, error?: string): never {
  if (!error) redirect(path);
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`);
}

/** The public register (landing page + directory) is statically cached: refresh it whenever it could change. */
function refreshRegister() {
  revalidatePath("/");
  revalidatePath("/startups");
}

const optional = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function reviewApplicationAction(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({
    app_id: uuid,
    decision: z.enum(["save", "under_review", "interview_pending", "interview_completed", "request_info", "reject", "suspend", "approve"]),
  }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = `/admin/applications/${parsed.data.app_id}`;
  const e = entries(formData);

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_application", {
    p_app: parsed.data.app_id,
    p_decision: parsed.data.decision,
    p_notes: optional(e.notes) ?? undefined,
    p_reason: optional(e.reason) ?? undefined,
    p_checks: {
      website: formData.get("check_website") === "on",
      followers: formData.get("check_followers") === "on",
      posts: formData.get("check_posts") === "on",
      relationship: formData.get("check_relationship") === "on",
    },
  });
  if (error) back(path, describeDbError(error));
  revalidatePath("/admin", "layout");
  refreshRegister();
  back(path);
}

export async function manageInterviewAction(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({
    app_id: uuid,
    action: z.enum(["schedule", "complete", "notes"]),
    scheduled_at: z.string().optional(),
    meeting_link: z.string().url().optional().or(z.literal("")),
    notes: z.string().max(5000).optional(),
    recommendation: z.enum(["approve", "reject", "needs_more_info"]).optional().or(z.literal("")),
    return_to: z.string().optional(),
  }).safeParse(entries(formData));
  const returnTo = typeof formData.get("return_to") === "string" && String(formData.get("return_to")).startsWith("/admin")
    ? String(formData.get("return_to")) : "/admin/interviews";
  if (!parsed.success) back(returnTo, "Please check the interview details.");
  const d = parsed.data!;
  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_interview", {
    p_app: d.app_id,
    p_action: d.action,
    p_scheduled_at: d.scheduled_at ? new Date(d.scheduled_at).toISOString() : undefined,
    p_meeting_link: d.meeting_link || undefined,
    p_notes: d.notes || undefined,
    p_recommendation: d.recommendation || undefined,
  });
  if (error) back(returnTo, describeDbError(error));
  revalidatePath("/admin", "layout");
  back(returnTo);
}

export async function resolveClaimRow(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({ id: uuid, approve: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_claim", { p_claim: parsed.data.id, p_approve: parsed.data.approve === "true" });
  if (error) back("/admin/startups", describeDbError(error));
  revalidatePath("/admin/startups");
  refreshRegister();
}

export async function verifyStartupRow(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({ id: uuid, verify: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_startup", { p_startup: parsed.data.id, p_verify: parsed.data.verify === "true" });
  if (error) back("/admin/startups", describeDbError(error));
  revalidatePath("/admin/startups");
  refreshRegister();
}

export async function setUserStatusRow(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({
    id: uuid,
    action: z.enum(["suspend", "restore", "revoke_verification", "make_moderator", "remove_moderator"]),
    reason: z.string().max(1000).optional(),
  }).safeParse(entries(formData));
  if (!parsed.success) back("/admin/users", "Invalid request.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_status", {
    p_user: parsed.data!.id, p_action: parsed.data!.action, p_reason: optional(parsed.data!.reason) ?? undefined,
  });
  if (error) back("/admin/users", describeDbError(error));
  revalidatePath("/admin/users");
}

export async function moderateReportRow(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: uuid,
    action: z.enum(["dismiss", "remove_content"]),
    note: z.string().max(1000).optional(),
  }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_report", {
    p_report: parsed.data.id, p_action: parsed.data.action, p_note: optional(parsed.data.note) ?? undefined,
  });
  if (error) back("/admin/moderation", describeDbError(error));
  revalidatePath("/admin/moderation");
}

export async function reviewOpportunityRow(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ id: uuid, approve: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_opportunity", { p_id: parsed.data.id, p_approve: parsed.data.approve === "true" });
  if (error) back("/admin/opportunities", describeDbError(error));
  revalidatePath("/admin/opportunities");
}

export async function updateSettingRow(formData: FormData) {
  const admin = await requireSuperAdmin();
  const parsed = z.object({
    key: z.enum(["applications_open", "min_company_followers", "min_company_posts"]),
    value: z.string(),
  }).safeParse(entries(formData));
  if (!parsed.success) back("/admin/settings", "Invalid setting.");
  const { key, value } = parsed.data!;
  const json = key === "applications_open" ? value === "true" : Number.parseInt(value, 10);
  if (typeof json === "number" && (!Number.isFinite(json) || json < 0 || json > 100000)) back("/admin/settings", "Enter a valid number.");
  const supabase = await createClient();
  const { error } = await supabase.from("platform_settings")
    .update({ value: json, updated_by: admin.id, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) back("/admin/settings", describeDbError(error));
  revalidatePath("/admin/settings");
}

export async function setApplicationVisibilityAction(formData: FormData) {
  await requireSuperAdmin();
  const parsed = z.object({ app_id: uuid, hidden: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = `/admin/applications/${parsed.data.app_id}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_application_visibility", {
    p_app: parsed.data.app_id, p_hidden: parsed.data.hidden === "true",
  });
  if (error) back(path, describeDbError(error));
  refreshRegister();
  back(path);
}
