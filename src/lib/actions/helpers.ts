import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/actions/result";

export const uuid = z.string().uuid();

export function entries(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

/** Zod issues → ActionResult with per-field messages. */
export function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const i of error.issues) (fieldErrors[i.path.join(".")] ??= []).push(i.message);
  return fail("Please check the highlighted fields.", fieldErrors);
}

/** Row actions: on failure bounce back to the page with ?error= (shown by <Flash/>). */
export function bounce(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

/** Only same-site relative paths are accepted as redirect targets. */
export function safePath(value: unknown, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Uploads an image to a public bucket under the user's own folder. Returns the public URL or null. */
export async function uploadImage(
  bucket: "post-media" | "story-media",
  userId: string,
  file: FormDataEntryValue | null,
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!IMAGE_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("invalid_image");
  const supabase = await createClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw new Error("upload_failed");
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
