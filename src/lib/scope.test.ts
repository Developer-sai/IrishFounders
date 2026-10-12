import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORLD_CITIES, cityToCoords, resolveCity } from "./geo";

/** The product is worldwide and named Space of Founders. The old name and country-only positioning must not return. */
const FORBIDDEN = /Irish\s*Founders|irishfounders|from Ireland to the world|built in Ireland|Republic of Ireland|only for (Ireland|Dublin)/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|md)$/.test(name) && !name.endsWith("scope.test.ts") && !name.endsWith("database.types.ts")) out.push(p);
  }
  return out;
}

describe("brand and scope: Space of Founders, worldwide", () => {
  it("has no old-name or country-only copy in the source", () => {
    const hits = walk("src").filter((f) => FORBIDDEN.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("offers hubs on every inhabited continent", () => {
    const countries = new Set(WORLD_CITIES.map((c) => c.country));
    expect(WORLD_CITIES.length).toBeGreaterThanOrEqual(40);
    for (const c of ["United States", "Brazil", "Nigeria", "India", "Australia", "Germany", "Japan"]) expect(countries.has(c)).toBe(true);
  });

  it("resolves known cities and returns null for unknown places", () => {
    expect(resolveCity("Lagos, Nigeria")?.name).toBe("Lagos");
    expect(resolveCity("somewhere unknown")).toBeNull();
    expect(resolveCity(null)).toBeNull();
    expect(cityToCoords("nowhere")).toBeNull();
  });

  it("jitters pins deterministically and keeps them near the city", () => {
    const a = cityToCoords("Singapore", "company-1")!;
    const b = cityToCoords("Singapore", "company-1")!;
    const c = cityToCoords("Singapore", "company-2")!;
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(Math.abs(a[0] - 1.3521)).toBeLessThan(0.2);
  });
});
