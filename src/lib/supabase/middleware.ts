import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const MEMBER_PREFIXES = [
  "/dashboard", "/feed", "/discover", "/design-partners", "/collaborate", "/investors",
  "/opportunities", "/messages", "/notifications", "/settings", "/saved", "/stories",
];
const AUTH_ONLY_PREFIXES = ["/onboarding", "/application"];
const PROTECTED_PREFIXES = [...MEMBER_PREFIXES, ...AUTH_ONLY_PREFIXES, "/admin", "/investor"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/** Supabase stores the session in cookies named sb-<ref>-auth-token (possibly chunked as .0, .1). */
const hasAuthCookie = (request: NextRequest) =>
  request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

/**
 * First, cheap route guard. Design goals:
 *  - public pages cost nothing (no auth round trip, no database query);
 *  - protected pages read the session from the cookie locally and only call the network when the
 *    access token has expired (getSession() refreshes it and rewrites the cookie);
 *  - the cookie is NOT trusted for authorisation: layouts verify with getUser() and RLS verifies the JWT,
 *    so a forged cookie gets a redirect or empty data, never access;
 *  - role and approval checks live in the layouts (cached per request), not here.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = matches(path, PROTECTED_PREFIXES);
  const isAuthPage = path === "/login" || path === "/signup";

  if (!isProtected && !isAuthPage) return NextResponse.next({ request });

  // No session cookie: nothing to refresh. Send protected requests to login immediately.
  if (!hasAuthCookie(request)) {
    if (!isProtected) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

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

  if (isAuthPage) {
    // Redirecting a signed-in user away from /login must use a VERIFIED check: a revoked session whose
    // access token has not expired yet would otherwise bounce between /login and /feed.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  // Protected routes: local decode + refresh-if-expired. We only test for existence, never read session.user.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }
  return response;
}
