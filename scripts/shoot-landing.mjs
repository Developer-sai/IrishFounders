// Local visual QA helper: seeds sample companies (service role, local only) and screenshots the landing page.
// Usage: node scripts/shoot-landing.mjs [seed|nosee]
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error("local only");
const B = "http://localhost:3100";
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);

if (process.argv[2] === "seed") {
  const cities = ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Sligo", "Kilkenny", "Dublin", "Cork", "Galway"];
  const names = ["Fintrack", "Greenloop", "Healthbridge", "Tidal", "Nimbus", "Cairn", "Harbour", "Lumen", "Orbit", "Quill"];
  const industries = ["FinTech", "CleanTech", "HealthTech", "Logistics", "SaaS", "DeepTech", "Retail", "EdTech", "Space", "Media"];
  for (let i = 0; i < 10; i++) {
    const email = `seed${i}-${run}@example.test`;
    const { data } = await admin.auth.admin.createUser({ email, password: "correct-horse-battery-staple", email_confirm: true, user_metadata: { full_name: `Seed ${i}` } });
    const id = data.user.id;
    const slug = `${names[i].toLowerCase()}-${run}`;
    if (i < 6) {
      await admin.from("profiles").update({ role: "founder", verification_status: "approved" }).eq("id", id);
      const { data: st } = await admin.from("startups").insert({
        name: names[i], slug, website_url: `https://${slug}.example`, linkedin_url: `https://linkedin.com/company/${slug}`,
        normalized_domain: "", normalized_linkedin: "", industry: industries[i], stage: "mvp", founded_year: 2024, location: cities[i],
        short_description: "Sample", is_verified: true, created_by: id,
      }).select("id").single();
      await admin.from("startup_members").insert({ startup_id: st.id, profile_id: id, is_admin: true });
    } else {
      await admin.from("profiles").update({ verification_status: "submitted" }).eq("id", id);
      await admin.from("membership_applications").insert({
        profile_id: id, applicant_type: "founder", company_name: names[i], company_website: `https://${slug}.example`, normalized_domain: `${slug}.example`,
        company_linkedin: `https://linkedin.com/company/${slug}`, normalized_linkedin: `linkedin.com/company/${slug}`, industry: industries[i], stage: "idea",
        company_city: cities[i], show_publicly: true,
      });
    }
  }
  console.log("seeded");
  if (process.argv[3] === "only") process.exit(0);
}

const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
async function shot(name, w, h, full) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 600 ? 2 : 1 });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  if (full) {
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(100); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  }
  console.log(name, "overflow-x:", await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), errors.length ? errors : "no errors");
  await p.screenshot({ path: `${process.env.TEMP ?? "."}/${name}.png`, fullPage: !!full });
  if (name === "land-desktop") {
    const cv = p.locator("canvas").first();
    if (await cv.count()) await cv.screenshot({ path: `${process.env.TEMP ?? "."}/globe-canvas.png`, omitBackground: true });
  }
  await c.close();
}
await shot("land-desktop", 1360, 860, false);
await shot("land-full", 1360, 860, true);
await shot("land-mobile", 390, 844, false);
await b.close();
