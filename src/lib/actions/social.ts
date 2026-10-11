"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import { describeDbError, fail, ok, type ActionResult } from "@/lib/actions/result";
import { bounce, entries, invalid, safePath, uploadImage, uuid } from "@/lib/actions/helpers";

const OPEN_TO = ["cofounder", "mentor", "hiring", "investors", "design_partners", "collaborators"] as const;
const OFFERING = ["cofounder", "mentor", "talent", "investment", "feedback", "collaboration"] as const;

const checked = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).max(values.length);

/* ------------------------------------------------------------------ identity */

export async function updateIdentity(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    handle: z
      .string().trim().toLowerCase()
      .refine((v) => v === "" || /^[a-z0-9_]{3,30}$/.test(v), "3-30 letters, numbers or underscores")
      .optional(),
    open_to: checked(OPEN_TO),
    offering: checked(OFFERING),
  }).safeParse({
    handle: formData.get("handle") ?? "",
    open_to: formData.getAll("open_to"),
    offering: formData.getAll("offering"),
  });
  if (!parsed.success) return invalid(parsed.error);

  let cover: string | null = null;
  try {
    cover = await uploadImage("post-media", id, formData.get("cover"));
  } catch {
    return fail("Cover images must be PNG, JPEG or WebP and under 5MB.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    handle: parsed.data.handle || null,
    open_to: parsed.data.open_to,
    offering: parsed.data.offering,
    ...(cover ? { cover_url: cover } : {}),
  }).eq("id", id);
  if (error) {
    if (error.code === "23505") return fail("That handle is taken.", { handle: ["That handle is taken."] });
    if (error.code === "23514") return fail("That handle is not allowed. Use 3-30 letters, numbers or underscores.", { handle: ["Not allowed"] });
    return fail(describeDbError(error));
  }
  revalidatePath("/settings");
  revalidatePath(`/founders/${id}`);
  return ok();
}

/* ------------------------------------------------------------------ follows */

export async function followUserRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid, path: z.string().optional() }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path, "/feed");
  const supabase = await createClient();
  const { error } = await supabase.rpc("follow_user", { p_user: parsed.data.id });
  if (error) bounce(path, describeDbError(error));
  revalidatePath(path);
}

export async function unfollowUserRow(formData: FormData) {
  const { id: me } = await requireMember();
  const parsed = z.object({ id: uuid, path: z.string().optional() }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path, "/feed");
  const supabase = await createClient();
  const { error } = await supabase.from("follows").delete().eq("follower_id", me).eq("followed_id", parsed.data.id);
  if (error) bounce(path, describeDbError(error));
  revalidatePath(path);
}

export async function toggleStartupFollowRow(formData: FormData) {
  const { id: me } = await requireMember();
  const parsed = z.object({ id: uuid, path: z.string().optional() }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path, "/feed");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("startup_follows").select("startup_id")
    .eq("user_id", me).eq("startup_id", parsed.data.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("startup_follows").delete().eq("user_id", me).eq("startup_id", parsed.data.id)
    : await supabase.from("startup_follows").insert({ user_id: me, startup_id: parsed.data.id });
  if (error) bounce(path, describeDbError(error));
  revalidatePath(path);
}

/* ------------------------------------------------------------------ stories */

export async function createStory(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    text: z.string().trim().max(280, "Keep it under 280 characters").optional(),
    kind: z.enum(["update", "milestone", "hiring", "looking_for", "launch"]),
    startup_id: z.string().uuid().optional().or(z.literal("")),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);

  let media: string | null = null;
  try {
    media = await uploadImage("story-media", id, formData.get("image"));
  } catch {
    return fail("Images must be PNG, JPEG or WebP and under 5MB.");
  }
  if (!parsed.data.text && !media) return fail("Add a line of text or an image.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_story", {
    p_text: parsed.data.text ?? "",
    p_media_url: media ?? (null as unknown as string),
    p_kind: parsed.data.kind,
    p_startup: parsed.data.startup_id || (null as unknown as string),
  });
  if (error) {
    if (error.message.includes("story_limit")) return fail("You've reached today's limit of 10 stories.");
    return fail(describeDbError(error));
  }
  revalidatePath("/feed");
  redirect("/feed");
}

/** Called by the viewer for each story shown. Idempotent. */
export async function markStoryViewed(storyId: string): Promise<void> {
  const { id } = await requireMember();
  if (!uuid.safeParse(storyId).success) return;
  const supabase = await createClient();
  await supabase.from("story_views").upsert({ story_id: storyId, viewer_id: id }, { onConflict: "story_id,viewer_id", ignoreDuplicates: true });
}

export async function deleteStoryRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("stories").delete().eq("id", parsed.data.id);
  revalidatePath("/feed");
}

/* ------------------------------------------------------------------ feed interactions (optimistic UI) */

export async function toggleReaction(postId: string): Promise<{ ok: boolean }> {
  const { id } = await requireMember();
  if (!uuid.safeParse(postId).success) return { ok: false };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("post_reactions").select("post_id").eq("post_id", postId).eq("user_id", id).maybeSingle();
  const { error } = existing
    ? await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", id)
    : await supabase.from("post_reactions").insert({ post_id: postId, user_id: id });
  revalidatePath("/feed");
  return { ok: !error };
}

/* ------------------------------------------------------------------ discover */

export async function passMatchRow(formData: FormData) {
  const { id } = await requireMember();
  const parsed = z.object({ id: uuid, path: z.string().optional() }).safeParse(entries(formData));
  if (!parsed.success) return;
  const path = safePath(parsed.data.path, "/discover");
  const supabase = await createClient();
  const { error } = await supabase.from("discover_passes").insert({ user_id: id, target_id: parsed.data.id });
  if (error && error.code !== "23505") bounce(path, describeDbError(error));
  revalidatePath("/discover");
  redirect(path);
}

/* ------------------------------------------------------------------ milestones */

export async function addMilestone(_p: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { id } = await requireMember();
  const parsed = z.object({
    startup_id: uuid,
    title: z.string().trim().min(3, "Give it a short title").max(140),
    occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    kind: z.enum(["milestone", "launch", "funding", "hire", "award", "other"]),
  }).safeParse(entries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("startup_milestones").insert({ ...parsed.data, created_by: id });
  if (error) return fail(error.code === "42501" ? "Only company admins can add milestones." : describeDbError(error));
  revalidatePath("/dashboard/startup");
  return ok();
}

export async function deleteMilestoneRow(formData: FormData) {
  await requireMember();
  const parsed = z.object({ id: uuid }).safeParse(entries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("startup_milestones").delete().eq("id", parsed.data.id);
  revalidatePath("/dashboard/startup");
}
