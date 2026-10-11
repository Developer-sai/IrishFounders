import { describe, expect, it } from "vitest";
import { isLinkedinCompanyUrl, normalizeDomain, normalizeLinkedin } from "./normalize";

describe("normalizeDomain", () => {
  it.each([
    ["https://www.Acme.ie/path?x=1", "acme.ie"],
    ["HTTP://acme.ie:8080/", "acme.ie"],
    ["acme.ie.", "acme.ie"],
    ["  www.acme.ie#top ", "acme.ie"],
    ["https://user@acme.ie", "acme.ie"],
  ])("%s -> %s", (input, expected) => expect(normalizeDomain(input)).toBe(expected));

  it("returns null for empty input", () => expect(normalizeDomain("  ")).toBeNull());
});

describe("normalizeLinkedin", () => {
  it("collapses locale subdomains, queries and trailing slashes", () => {
    expect(normalizeLinkedin("https://ie.linkedin.com/company/Acme/?trk=1")).toBe("linkedin.com/company/acme");
  });

  it("accepts only company pages", () => {
    expect(isLinkedinCompanyUrl("https://www.linkedin.com/company/acme")).toBe(true);
    expect(isLinkedinCompanyUrl("https://www.linkedin.com/in/someone")).toBe(false);
    expect(isLinkedinCompanyUrl("https://example.com/company/acme")).toBe(false);
  });
});
