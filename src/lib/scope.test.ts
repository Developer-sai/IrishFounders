import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IRISH_CITIES, cityToCoords, resolveCity } from "./geo";

/** Scope is the Republic of Ireland. Northern Ireland references must not creep back into the product. */
const FORBIDDEN = /\b(Belfast|Derry|Londonderry|Northern Ireland|north and south|Antrim|Armagh|Fermanagh|Tyrone)\b/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|md)$/.test(name) && !name.endsWith("scope.test.ts")) out.push(p);
  }
  return out;
}

describe("scope: Republic of Ireland", () => {
  it("has no Northern Ireland references in the source", () => {
    const hits = walk("src").filter((f) => FORBIDDEN.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("only offers Republic cities", () => {
    expect(IRISH_CITIES.map((c) => c.name).join(" ")).not.toMatch(FORBIDDEN);
    expect(IRISH_CITIES.length).toBeGreaterThanOrEqual(15);
  });

  it("resolves city text and falls back to Dublin", () => {
    expect(resolveCity("Cork, Ireland").name).toBe("Cork");
    expect(resolveCity("somewhere unknown").name).toBe("Dublin");
    expect(resolveCity(null).name).toBe("Dublin");
  });

  it("jitters pins deterministically and keeps them near the city", () => {
    const a = cityToCoords("Galway", "company-1");
    const b = cityToCoords("Galway", "company-1");
    const c = cityToCoords("Galway", "company-2");
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(Math.abs(a[0] - 53.2707)).toBeLessThan(0.2);
  });
});
