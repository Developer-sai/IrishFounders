"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { describeDbError, duplicateSlug, fail, ok, type ActionResult } from "@/lib/actions/result";
import { STARTUP_STAGES } from "@/lib/validations/application";
import { COLLAB_CATEGORIES, OPPORTUNITY_CATEGORIES, POST_CATEGORIES } from "@/lib/constants";

/* ------------------------------------------------------------------ helpers */

const str = (max: number, min = 1) => z.string().trim().min(min).max(max);
const optStr = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const uuid = z.string().uuid();
const optUrl = z
  .string().trim().max(300).optional()
  .transform((v) => (v ? (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`) : undefined))
  .pipe(z.string().url().optional());
const reqUrl = z
  .string().trim().min(1).max(300)
  .transform((v) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`))
  .pipe(z.string().url());

function entries(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const i of error.issues) (fieldErrors[i.path.join(".")] ??= []).push(i.message);
  return fail("Please check the highlighted fields.", fieldErrors);
}

/** Row actions (button in a list): on failure, bounce back to the page with ?error=. */
function bounce(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}error=${encodeURIComponent(message)}`);
}

function safePath(value: FormDataEntryValue | null, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function uploadImage(
  bucket: "post-media",
  userId: string,
  file: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("invalid_image");
  }
  const supabase = await createClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw new Error("upload_failed");
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/* ------------------------------------------------------------------ feed */

const postSchema = z.object({
  category: z.enum(POST_CATEGORIES),
  title: optStr(150),
  content: str(5000),
  external_link: optUrl,
  startup_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
});

export async function createPost(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = postSchema.safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadImage("post-media", id, formData.get("image"));
  } catch {
    return fail("Images must be PNG, JPEG or WebP and under 5MB.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    author_id: id,
    category: parsed.data.category,
    title: parsed.data.title,
    content: parsed.data.content,
    external_link: parsed.data.external_link,
    startup_id: parsed.data.startup_id,
    media_urls: imageUrl ? [imageUrl] : [],
  });
  if (error) return fail(describeDbError(error));
  revalidatePath("/feed");
  return ok();
}

export async function deletePostRow(formData: FormData) {
  await requireMember();
  const supabase = await createClient();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const { error } = await supabase.from("posts").delete().eq("id", id.data);
  if (error) bounce("/feed", describeDbError(error));
  revalidatePath("/feed");
}

export async function toggleReactionRow(formData: FormData) {
  const { id: userId } = await requireMember();
  const postId = uuid.safeParse(formData.get("id"));
  if (!postId.success) return;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_reactions").select("post_id").eq("post_id", postId.data).eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await supabase.from("post_reactions").delete().eq("post_id", postId.data).eq("user_id", userId)
    : await supabase.from("post_reactions").insert({ post_id: postId.data, user_id: userId });
  if (error) bounce("/feed", describeDbError(error));
  revalidatePath("/feed");
}

export async function addComment(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({ post_id: uuid, content: str(2000), parent_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined) })
    .safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("post_comments").insert({ ...parsed.data, author_id: id });
  if (error) return fail(describeDbError(error));
  revalidatePath("/feed");
  return ok();
}

export async function toggleSavedRow(formData: FormData) {
  const { id: userId } = await requireMember();
  const parsed = z.object({
    type: z.enum(["post", "launch", "startup", "opportunity"]),
    id: uuid,
    path: z.string().optional(),
  }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path ?? null, "/saved");
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saved_items").select("item_id")
    .eq("user_id", userId).eq("item_type", parsed.data.type).eq("item_id", parsed.data.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("saved_items").delete()
        .eq("user_id", userId).eq("item_type", parsed.data.type).eq("item_id", parsed.data.id)
    : await supabase.from("saved_items").insert({ user_id: userId, item_type: parsed.data.type, item_id: parsed.data.id });
  if (error) bounce(path, describeDbError(error));
  revalidatePath(path);
}

export async function reportContent(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    target_type: z.enum(["post", "comment", "profile", "startup", "launch", "message", "conversation"]),
    target_id: uuid,
    reason: str(1000, 3),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({ ...parsed.data, reporter_id: id });
  if (error) return fail(error.code === "23505" ? "You have already reported this." : describeDbError(error));
  return ok();
}

/* ------------------------------------------------------------------ launches */

const launchSchema = z.object({
  startup_id: uuid,
  name: str(80, 2),
  tagline: str(140, 3),
  description: str(3000, 10),
  website_url: reqUrl,
  category: str(60, 2),
  stage: z.enum(STARTUP_STAGES),
  feedback_requested: optStr(500),
});

export async function createLaunch(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = launchSchema.safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("product_launches").insert({
    ...parsed.data, slug: parsed.data.name, founder_id: id,
  });
  if (error) {
    return fail(error.code === "23505" ? "You have already launched a product with that name." : describeDbError(error));
  }
  revalidatePath("/launches");
  return ok();
}

export async function toggleVoteRow(formData: FormData) {
  const { id: userId } = await requireMember();
  const launchId = uuid.safeParse(formData.get("id"));
  if (!launchId.success) return;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("launch_votes").select("launch_id").eq("launch_id", launchId.data).eq("user_id", userId).maybeSingle();
  const { error } = existing
    ? await supabase.from("launch_votes").delete().eq("launch_id", launchId.data).eq("user_id", userId)
    : await supabase.from("launch_votes").insert({ launch_id: launchId.data, user_id: userId });
  if (error) bounce("/launches", describeDbError(error));
  revalidatePath("/launches");
}

export async function addLaunchFeedback(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({ launch_id: uuid, content: str(2000) }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("product_feedback").insert({ ...parsed.data, author_id: id });
  if (error) return fail(describeDbError(error));
  revalidatePath("/launches");
  return ok();
}

/* ------------------------------------------------------------------ design partners / collaboration */

export async function createDesignPartnerRequest(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    startup_id: uuid,
    title: str(150, 3),
    product_name: optStr(100),
    target_user: str(300, 3),
    problem_statement: str(2000, 10),
    feedback_type: str(300, 3),
    partners_needed: z.coerce.number().int().min(1).max(50),
    expected_commitment: str(300, 3),
    work_mode: z.enum(["remote", "in_person", "hybrid"]),
    deadline: z.string().optional().transform((v) => v || undefined),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("design_partner_requests").insert({ ...parsed.data, founder_id: id });
  if (error) return fail(describeDbError(error));
  revalidatePath("/design-partners");
  return ok();
}

export async function applyDesignPartner(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({ request_id: uuid, message: str(1000, 5) }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("design_partner_applications").insert({ ...parsed.data, applicant_id: id });
  if (error) return fail(error.code === "23505" ? "You have already expressed interest." : describeDbError(error));
  revalidatePath("/design-partners");
  return ok();
}

export async function respondDesignPartnerRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid, accept: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_design_partner", { p_id: parsed.data.id, p_accept: parsed.data.accept === "true" });
  if (error) bounce("/design-partners", describeDbError(error));
  revalidatePath("/design-partners");
}

export async function createCollaboration(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    category: z.enum(COLLAB_CATEGORIES),
    title: str(150, 3),
    description: str(3000, 10),
    skills_needed: z.string().optional().transform((v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15)),
    industry: optStr(80),
    location: optStr(80),
    commitment_type: str(80, 2),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("collaboration_listings").insert({ ...parsed.data, creator_id: id });
  if (error) return fail(describeDbError(error));
  revalidatePath("/collaborate");
  return ok();
}

export async function closeCollaborationRow(formData: FormData) {
  await requireMember();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("collaboration_listings").update({ is_active: false }).eq("id", id.data);
  revalidatePath("/collaborate");
}

/* ------------------------------------------------------------------ networking */

export async function requestConnectionRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid, path: z.string().optional() }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path ?? null, "/discover");
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_connection", { p_recipient: parsed.data.id });
  if (error) bounce(path, describeDbError(error));
  revalidatePath(path);
}

export async function respondConnectionRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid, accept: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_connection", { p_id: parsed.data.id, p_accept: parsed.data.accept === "true" });
  if (error) bounce("/dashboard", describeDbError(error));
  revalidatePath("/dashboard");
  revalidatePath("/messages");
}

export async function blockUserRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("block_user", { p_user: parsed.data.id });
  if (error) bounce("/messages", describeDbError(error));
  revalidatePath("/messages");
}

export async function sendMessage(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({ conversation_id: uuid, content: str(4000) }).safeParse(entries(formData));
  if (!parsed.success) return fail("Write a message first.");
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ ...parsed.data, sender_id: id });
  if (error) return fail(error.code === "42501" ? "You can only message accepted connections." : describeDbError(error));
  return ok();
}

export async function markConversationRead(conversationId: string) {
  await requireMember();
  if (!uuid.safeParse(conversationId).success) return;
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { p_conv: conversationId });
}

export async function markNotificationsReadRow() {
  const { id } = await requireMember();
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", id).eq("is_read", false);
  revalidatePath("/notifications");
}

/* ------------------------------------------------------------------ opportunities */

export async function createOpportunity(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    category: z.enum(OPPORTUNITY_CATEGORIES),
    title: str(150, 3),
    description: str(3000, 10),
    source_url: reqUrl,
    location: optStr(100),
    starts_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : undefined)),
    expires_at: z.string().optional().transform((v) => (v ? new Date(v).toISOString() : undefined)),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").insert({ ...parsed.data, created_by: id });
  if (error) return fail(describeDbError(error));
  revalidatePath("/opportunities");
  return ok();
}

/* ------------------------------------------------------------------ profile & startup */

export async function updateProfile(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const csv = z.string().optional().transform((v) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20));
  const parsed = z.object({
    full_name: str(100, 2),
    headline: optStr(160),
    bio: optStr(2000),
    location: optStr(100),
    linkedin_url: optUrl,
    skills: csv,
    areas_of_expertise: csv.optional(),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const hidden = formData.getAll("hidden_fields").filter((v): v is string => typeof v === "string")
    .filter((v) => ["avatar", "bio", "location", "linkedin", "skills"].includes(v));
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    full_name: parsed.data.full_name,
    headline: parsed.data.headline ?? null,
    bio: parsed.data.bio ?? null,
    location: parsed.data.location ?? null,
    linkedin_url: parsed.data.linkedin_url ?? null,
    skills: parsed.data.skills,
    hidden_fields: hidden,
  }).eq("id", id);
  if (error) return fail(describeDbError(error));
  revalidatePath("/settings");
  return ok();
}

export async function createStartup(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = z.object({
    name: str(120, 2),
    website_url: reqUrl,
    linkedin_url: reqUrl,
    industry: str(80, 2),
    stage: z.enum(STARTUP_STAGES),
    location: optStr(100),
    founded_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
    team_size: z.coerce.number().int().min(1).max(10000),
    short_description: str(500, 10),
    problem_statement: optStr(2000),
    product_overview: optStr(3000),
    role_title: optStr(80),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_startup", { p: parsed.data });
  if (error) {
    const slug = duplicateSlug(error);
    return fail(slug
      ? "This company already exists on Irish Founders. Search for it in the startup directory and request to claim it."
      : describeDbError(error));
  }
  revalidatePath("/dashboard/startup");
  return ok();
}

export async function updateStartup(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = z.object({
    id: uuid,
    short_description: str(500, 10),
    problem_statement: optStr(2000),
    product_overview: optStr(3000),
    location: optStr(100),
    team_size: z.coerce.number().int().min(1).max(10000),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("startups").update({
    short_description: rest.short_description,
    problem_statement: rest.problem_statement ?? null,
    product_overview: rest.product_overview ?? null,
    location: rest.location ?? null,
    team_size: rest.team_size,
  }).eq("id", id).select("id");
  if (error) return fail(describeDbError(error));
  if (!data?.length) return fail("You do not have permission to edit this startup.");
  revalidatePath("/dashboard/startup");
  return ok();
}

export async function claimStartup(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = z.object({ startup_id: uuid, message: str(1000, 10) }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_startup", { p_startup: parsed.data.startup_id, p_message: parsed.data.message });
  if (error) return fail(error.code === "23505" ? "You already have a pending request for this company." : describeDbError(error));
  revalidatePath("/dashboard/startup");
  return ok();
}

/* ------------------------------------------------------------------ investor introductions */

export async function requestIntroduction(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = z.object({ founder_id: uuid, startup_id: uuid, message: str(1000, 10) }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_introduction", {
    p_founder: parsed.data.founder_id, p_startup: parsed.data.startup_id, p_message: parsed.data.message,
  });
  if (error) return fail(error.code === "23505" ? "You have already requested an introduction." : describeDbError(error));
  revalidatePath("/investor/introductions");
  return ok();
}

export async function respondIntroductionRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid, accept: z.enum(["true", "false"]) }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_introduction", { p_id: parsed.data.id, p_accept: parsed.data.accept === "true" });
  if (error) bounce("/dashboard", describeDbError(error));
  revalidatePath("/dashboard");
  revalidatePath("/messages");
}
