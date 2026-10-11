/**
 * Cities in the Republic of Ireland used for company locations and for placing pins on the globe.
 * Scope is the Republic only; `scope.test.ts` fails the build if out-of-scope place names return.
 */
export type City = { name: string; lat: number; lng: number };

export const IRISH_CITIES: City[] = [
  { name: "Dublin", lat: 53.3498, lng: -6.2603 },
  { name: "Cork", lat: 51.8985, lng: -8.4756 },
  { name: "Galway", lat: 53.2707, lng: -9.0568 },
  { name: "Limerick", lat: 52.6638, lng: -8.6267 },
  { name: "Waterford", lat: 52.2593, lng: -7.1101 },
  { name: "Kilkenny", lat: 52.6541, lng: -7.2448 },
  { name: "Sligo", lat: 54.2766, lng: -8.4761 },
  { name: "Athlone", lat: 53.4239, lng: -7.9407 },
  { name: "Drogheda", lat: 53.7179, lng: -6.3561 },
  { name: "Dundalk", lat: 54.0, lng: -6.4167 },
  { name: "Tralee", lat: 52.2704, lng: -9.7026 },
  { name: "Killarney", lat: 52.0599, lng: -9.5044 },
  { name: "Ennis", lat: 52.8463, lng: -8.9807 },
  { name: "Wexford", lat: 52.3369, lng: -6.4633 },
  { name: "Carlow", lat: 52.8365, lng: -6.9341 },
  { name: "Naas", lat: 53.2158, lng: -6.6669 },
  { name: "Navan", lat: 53.6528, lng: -6.6814 },
  { name: "Mullingar", lat: 53.5259, lng: -7.3381 },
  { name: "Castlebar", lat: 53.8, lng: -9.5167 },
  { name: "Letterkenny", lat: 54.9549, lng: -7.7342 },
];

export const CITY_NAMES = IRISH_CITIES.map((c) => c.name) as [string, ...string[]];

const BY_NAME = new Map(IRISH_CITIES.map((c) => [c.name.toLowerCase(), c]));

/** Resolves free text like "Cork, Ireland" to a known city; unknown places fall back to Dublin. */
export function resolveCity(input?: string | null): City {
  const first = (input ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return BY_NAME.get(first) ?? IRISH_CITIES[0]!;
}

/** [lat, lng] for a city, with a tiny deterministic jitter so several companies in one city do not stack on one pixel. */
export function cityToCoords(city?: string | null, seed = ""): [number, number] {
  const c = resolveCity(city);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const jx = ((h & 0xff) / 255 - 0.5) * 0.18;
  const jy = (((h >> 8) & 0xff) / 255 - 0.5) * 0.18;
  return [c.lat + jx, c.lng + jy];
}
