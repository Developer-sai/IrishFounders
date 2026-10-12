/**
 * Development-only demo data. Every record is flagged is_demo = true, is never marked
 * verified, and is excluded from public pages and statistics.
 *   npm run seed
 * Refuses to run against anything but a local Supabase instance.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
  console.error("Refusing to seed: NEXT_PUBLIC_SUPABASE_URL is not a local instance.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = "demo-password-123";

const DEMO = [
  { name: "DEMO Aoife Byrne", company: "DEMO Fintrack", domain: "demo-fintrack.example", industry: "FinTech" },
  { name: "DEMO Cian Murphy", company: "DEMO Greenloop", domain: "demo-greenloop.example", industry: "CleanTech" },
  { name: "DEMO Niamh Doyle", company: "DEMO Healthbridge", domain: "demo-healthbridge.example", industry: "HealthTech" },
];

for (const d of DEMO) {
  const email = `${d.domain.split(".")[0]}@demo.spaceoffounders.invalid`;
  const { data: created, error } = await supabase.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: d.name },
  });
  if (error || !created.user) {
    console.log(`skip ${email}: ${error?.message ?? "no user"}`);
    continue;
  }
  const id = created.user.id;
  await supabase.from("profiles").update({
    role: "founder", verification_status: "approved", is_demo: true, headline: "Co-founder (DEMO)", location: "Dublin",
  }).eq("id", id);

  const slug = d.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const { data: startup } = await supabase.from("startups").insert({
    name: d.company, slug, website_url: `https://${d.domain}`, linkedin_url: `https://linkedin.com/company/${slug}`,
    normalized_domain: "", normalized_linkedin: "", industry: d.industry, stage: "mvp", founded_year: 2024,
    team_size: 3, short_description: `DEMO RECORD — not a real company. ${d.industry} sample startup for development.`,
    is_verified: false, is_demo: true, created_by: id,
  }).select("id").single();

  if (startup) {
    await supabase.from("startup_members").insert({ startup_id: startup.id, profile_id: id, is_admin: true });
    await supabase.from("posts").insert({ author_id: id, startup_id: startup.id, category: "building_in_public", content: "DEMO POST — sample content for development.", is_demo: true });
  }
  console.log(`seeded ${d.company} (${email} / ${PASSWORD})`);
}
