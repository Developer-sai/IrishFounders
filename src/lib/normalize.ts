/** Mirrors public.normalize_domain / normalize_linkedin in Postgres. The DB is the source of truth. */
export function normalizeDomain(input: string): string | null {
  let v = input.trim().toLowerCase();
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  v = v.split("/")[0]!.split("?")[0]!.split("#")[0]!;
  v = v.replace(/^.*@/, "").replace(/:\d+$/, "").replace(/\.+$/, "").replace(/^www\./, "");
  return v || null;
}

export function normalizeLinkedin(input: string): string | null {
  let v = input.trim().toLowerCase();
  v = v.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  v = v.split("?")[0]!.split("#")[0]!;
  v = v.replace(/^([a-z0-9-]+\.)?linkedin\.com/, "linkedin.com").replace(/\/+$/, "");
  return v || null;
}

export function isLinkedinCompanyUrl(input: string): boolean {
  const n = normalizeLinkedin(input);
  return !!n && /^linkedin\.com\/company\/[^/]+$/.test(n);
}
