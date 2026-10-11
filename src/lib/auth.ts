import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["user_role"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];

/** Explicit column list: `email` is intentionally not selectable by clients. */
export const PROFILE_COLUMNS =
  "id, full_name, role, verification_status, avatar_url, headline, bio, location, linkedin_url, skills, areas_of_expertise, hidden_fields, suspended_at, is_demo, handle, cover_url, open_to, offering";

export type SessionProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "role"
  | "verification_status"
  | "avatar_url"
  | "headline"
  | "bio"
  | "location"
  | "linkedin_url"
  | "skills"
  | "areas_of_expertise"
  | "hidden_fields"
  | "suspended_at"
  | "is_demo"
  | "handle"
  | "cover_url"
  | "open_to"
  | "offering"
> & { email: string };

/** Authenticated user + profile for this request (deduplicated per render). */
export const getSession = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  if (!data) return null;
  return { ...data, email: user.email ?? "" } as SessionProfile;
});

export const isApproved = (p: SessionProfile) => p.verification_status === "approved" && !p.suspended_at;

export async function requireUser(next?: string): Promise<SessionProfile> {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return session;
}

export async function requireMember(): Promise<SessionProfile> {
  const s = await requireUser();
  if (!isApproved(s)) redirect("/application/status");
  return s;
}

export async function requireInvestor(): Promise<SessionProfile> {
  const s = await requireMember();
  if (s.role !== "investor") redirect("/403");
  return s;
}

export async function requireAdmin(): Promise<SessionProfile> {
  const s = await requireMember();
  if (s.role !== "super_admin" && s.role !== "moderator") redirect("/403");
  return s;
}

export async function requireSuperAdmin(): Promise<SessionProfile> {
  const s = await requireAdmin();
  if (s.role !== "super_admin") redirect("/403");
  return s;
}

/** Where to send a signed-in user. */
export function homeFor(p: SessionProfile): string {
  if (!isApproved(p)) return "/application/status";
  if (p.role === "investor") return "/investor/dashboard";
  if (p.role === "super_admin" || p.role === "moderator") return "/admin";
  return "/feed";
}
