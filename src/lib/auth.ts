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

/** Reads the `sub` claim from a JWT without verifying it (verification happens via getUser() and RLS). */
function jwtSubject(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Authenticated user + profile for this request (deduplicated per render). */
export const getSession = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  // Cheap local read of the cookie to learn the user id, so verification and the profile query can run in parallel.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const id = session ? jwtSubject(session.access_token) : null;
  if (!id) return null;
  const [{ data: auth }, { data }] = await Promise.all([
    supabase.auth.getUser(), // authoritative: validates the token with the auth server
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle(), // RLS verifies the JWT too
  ]);
  const user = auth.user;
  if (!user || user.id !== id || !data) return null;
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
