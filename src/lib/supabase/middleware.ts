import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const MEMBER_PREFIXES = [
  "/dashboard", "/feed", "/discover", "/design-partners", "/collaborate", "/investors",
  "/opportunities", "/messages", "/notifications", "/settings",
];
const AUTH_ONLY_PREFIXES = ["/onboarding", "/application"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

function redirect(request: NextRequest, to: string, source: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  const res = NextResponse.redirect(url);
  source.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

/** Refreshes the session cookie and applies the first (coarse) route guard.
 *  Layouts and RLS remain the authoritative checks. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser() validates the JWT with the auth server; never trust getSession() here.
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isAdminArea = path === "/admin" || path.startsWith("/admin/");
  const isInvestorArea = path === "/investor" || path.startsWith("/investor/");
  const isMemberArea = matches(path, MEMBER_PREFIXES);
  const isAuthOnly = matches(path, AUTH_ONLY_PREFIXES);

  if (!user) {
    if (isAdminArea || isInvestorArea || isMemberArea || isAuthOnly) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(path)}`;
      const res = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    }
    return response;
  }

  if (path === "/login" || path === "/signup") return redirect(request, "/dashboard", response);

  if (isAdminArea || isInvestorArea || isMemberArea) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, verification_status, suspended_at")
      .eq("id", user.id)
      .maybeSingle();

    const approved = profile?.verification_status === "approved" && !profile.suspended_at;
    if (!approved) return redirect(request, "/application/status", response);

    if (isAdminArea && profile.role !== "super_admin" && profile.role !== "moderator") {
      return NextResponse.rewrite(new URL("/403", request.url), { status: 403 });
    }
    if (isInvestorArea && profile.role !== "investor") {
      return NextResponse.rewrite(new URL("/403", request.url), { status: 403 });
    }
  }
  return response;
}
