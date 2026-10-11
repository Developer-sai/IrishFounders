export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const ok = <T = undefined>(data?: T): ActionResult<T> => ({ ok: true, data: data as T });
export const fail = (error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

/** Maps errors raised by our SQL functions to user-facing copy. */
const MESSAGES: Record<string, string> = {
  not_authenticated: "Please sign in to continue.",
  forbidden: "You do not have permission to do that.",
  applications_closed: "Applications are currently closed.",
  already_member: "You are already a member.",
  rate_limited: "You have submitted too many applications today. Please try again tomorrow.",
  invalid_company: "Please provide a valid company name and website.",
  invalid_company_linkedin: "Please provide a valid LinkedIn company page URL (linkedin.com/company/...).",
  insufficient_followers: "The company LinkedIn page must have at least the minimum number of followers.",
  insufficient_posts: "Please provide links to at least the minimum number of company LinkedIn posts.",
  disclaimer_required: "You must accept the investor networking disclaimer.",
  not_awaiting_info: "This application is not awaiting more information.",
  notes_required: "Please add a note for the applicant.",
  reason_required: "A reason is required for this action.",
  interview_incomplete: "The interview must be completed before approval.",
  checklist_incomplete: "Complete the full verification checklist before approving.",
  cannot_review_own: "You cannot review your own application.",
  cannot_modify_admin: "You cannot modify an administrator account.",
  connection_exists: "A connection with this member already exists.",
  cannot_connect_self: "You cannot connect with yourself.",
  recipient_unavailable: "This member is not available to connect.",
  blocked: "You cannot contact this member.",
  invalid_target: "That founder is not associated with this startup.",
  date_required: "Please choose a date and time.",
  not_found: "We could not find that record.",
};

export function describeDbError(err: { message?: string; code?: string } | null | undefined): string {
  const raw = err?.message ?? "";
  if (raw.includes("duplicate_company:")) {
    return "This company already exists on Irish Founders. You can request to claim it instead.";
  }
  for (const key of Object.keys(MESSAGES)) if (raw.includes(key)) return MESSAGES[key]!;
  if (err?.code === "42501") return MESSAGES.forbidden!;
  if (err?.code === "23505") return "That already exists.";
  return "Something went wrong. Please try again.";
}

/** Extracts the slug from a `duplicate_company:<slug>` error. */
export function duplicateSlug(err: { message?: string } | null | undefined): string | null {
  const m = err?.message?.match(/duplicate_company:([a-z0-9-]+)/);
  return m?.[1] ?? null;
}
