import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Anonymous, cookie-free client for public data (landing page register, stats).
 * Because it never touches cookies() or headers(), routes that use it can be statically
 * rendered and served from the CDN, then revalidated on a timer or on demand.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public environment variables");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
