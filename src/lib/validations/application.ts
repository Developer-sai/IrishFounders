import { z } from "zod";
import { isLinkedinCompanyUrl } from "@/lib/normalize";
import { CITY_NAMES } from "@/lib/geo";

/** Accepts "acme.ie" or a full URL; always outputs an absolute https URL. */
const url = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(300)
    .transform((v) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url(`Enter a valid ${label.toLowerCase()}`));

const text = (label: string, max = 1500) => z.string().trim().min(2, `${label} is required`).max(max);

/** Company names appear on the public register, so keep them plain: no markup characters or control codes. */
const companyName = z
  .string()
  .trim()
  .min(2, "Company name is required")
  .max(80, "Keep the company name under 80 characters")
  .refine((v) => !/[<>\u0000-\u001f]/.test(v), "Use letters, numbers and common punctuation only");

export const STARTUP_STAGES = ["idea", "prototype", "mvp", "early_revenue", "scaling"] as const;
export const INVESTOR_CATEGORIES = ["angel", "vc", "syndicate", "family_office", "institutional"] as const;

export const INTERVIEW_QUESTIONS_FOUNDER = [
  ["problem", "What problem are you solving?"],
  ["why", "Why did you start this company?"],
  ["built", "What have you built so far?"],
  ["challenge", "What is your current biggest challenge?"],
  ["gain", "What are you hoping to gain from Irish Founders?"],
  ["contribute", "How can you contribute to other founders?"],
] as const;

export const INTERVIEW_QUESTIONS_INVESTOR = [
  ["background", "What is your investment background?"],
  ["interests", "What types of startups interest you?"],
  ["value", "What value can you offer founders beyond funding?"],
  ["why", "Why would you like to join Irish Founders?"],
] as const;

export const INTERVIEW_QUESTIONS_PARTNER = [
  ["about", "What does your organisation do for Irish founders?"],
  ["offer", "What programmes, events or opportunities would you publish?"],
  ["why", "Why would you like to join Irish Founders?"],
] as const;

const interview = (qs: readonly (readonly [string, string])[]) =>
  z.object(Object.fromEntries(qs.map(([k, q]) => [k, text(q, 2000)])) as Record<string, z.ZodString>);

export const profileStep = z.object({
  full_name: text("Full name", 100),
  linkedin_url: url("LinkedIn profile URL"),
  location: text("Location", 100),
  headline: text("Role", 120),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export const founderApplicationSchema = z.object({
  profile: profileStep,
  company_name: companyName,
  company_city: z.enum(CITY_NAMES),
  show_publicly: z.boolean().default(true),
  company_website: url("Company website"),
  company_linkedin: url("Company LinkedIn URL").refine(
    isLinkedinCompanyUrl,
    "Use a LinkedIn company page (linkedin.com/company/...)",
  ),
  industry: text("Industry", 80),
  stage: z.enum(STARTUP_STAGES),
  founded_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  team_size: z.coerce.number().int().min(1).max(10000),
  company_description: text("Description", 500),
  linkedin_follower_count: z.coerce.number().int().min(0).max(100_000_000),
  sample_post_urls: z.array(url("Post link")).min(2, "Provide at least two company post links").max(10),
  relationship_to_company: text("Your relationship to the company", 1000),
  interview: interview(INTERVIEW_QUESTIONS_FOUNDER),
});

export const investorApplicationSchema = z.object({
  profile: profileStep,
  organisation_name: z.string().trim().max(120).optional().or(z.literal("")),
  organisation_website: url("Organisation website").optional().or(z.literal("")),
  investor: z.object({
    investor_category: z.enum(INVESTOR_CATEGORIES),
    professional_background: text("Professional background", 2000),
    investment_sectors: z.array(z.string().trim().min(1)).min(1, "Add at least one sector").max(20),
    preferred_stages: z.array(z.enum(STARTUP_STAGES)).min(1, "Choose at least one stage"),
    geographic_preferences: z.array(z.string().trim().min(1)).max(20),
    public_portfolio_links: z.array(url("Portfolio link")).max(10),
    disclaimer_accepted: z.literal(true, { errorMap: () => ({ message: "You must accept the disclaimer" }) }),
  }),
  interview: interview(INTERVIEW_QUESTIONS_INVESTOR),
});

export const partnerApplicationSchema = z.object({
  profile: profileStep,
  organisation_name: text("Organisation name", 120),
  organisation_website: url("Organisation website"),
  partner: z.object({ organisation_type: text("Organisation type", 60) }),
  interview: interview(INTERVIEW_QUESTIONS_PARTNER),
});

export const infoResponseSchema = z.object({
  linkedin_follower_count: z.coerce.number().int().min(0).optional(),
  sample_post_urls: z.array(url("Post link")).max(10).optional(),
  relationship_to_company: z.string().trim().max(1000).optional(),
});
