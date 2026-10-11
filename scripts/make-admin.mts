/**
 * Promote an existing, email-confirmed user to super_admin.
 *   npm run make-admin -- someone@example.com
 * Uses the service-role key from the environment (.env.local). Never commit that key.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: profile, error } = await supabase.from("profiles").select("id, role").eq("email", email).maybeSingle();
if (error || !profile) {
  console.error(`No profile found for ${email}. Sign up and confirm the email first.`);
  process.exit(1);
}

const { error: updateError } = await supabase
  .from("profiles")
  .update({ role: "super_admin", verification_status: "approved", suspended_at: null })
  .eq("id", profile.id);
if (updateError) {
  console.error(updateError.message);
  process.exit(1);
}
await supabase.from("admin_audit_logs").insert({
  action: "bootstrap_super_admin", target_table: "profiles", target_id: profile.id, details: { via: "scripts/make-admin.ts" },
});
console.log(`${email} is now a super admin (${new URL(url).host}).`);
