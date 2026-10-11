import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

/** Service-role client. Server-only: bypasses RLS. Use sparingly (signed URLs, seeding). */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
