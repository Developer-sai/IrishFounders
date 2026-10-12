/**
 * Startup hubs used to suggest company cities and to place pins on the globe.
 * Space of Founders is worldwide: any city is accepted, and a pin is drawn when it matches a known hub.
 */
export type City = { name: string; country: string; lat: number; lng: number };

export const WORLD_CITIES: City[] = [
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Cork", country: "Ireland", lat: 51.8985, lng: -8.4756 },
  { name: "Galway", country: "Ireland", lat: 53.2707, lng: -9.0568 },
  { name: "London", country: "United Kingdom", lat: 51.5072, lng: -0.1276 },
  { name: "Manchester", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  { name: "Edinburgh", country: "United Kingdom", lat: 55.9533, lng: -3.1883 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Munich", country: "Germany", lat: 48.1351, lng: 11.582 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { name: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
  { name: "Tallinn", country: "Estonia", lat: 59.437, lng: 24.7536 },
  { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { name: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
  { name: "Austin", country: "United States", lat: 30.2672, lng: -97.7431 },
  { name: "Boston", country: "United States", lat: 42.3601, lng: -71.0589 },
  { name: "Miami", country: "United States", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", country: "United States", lat: 47.6062, lng: -122.3321 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  { name: "Bogotá", country: "Colombia", lat: 4.711, lng: -74.0721 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { name: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { name: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
];

export const CITY_NAMES = WORLD_CITIES.map((c) => c.name);

const BY_NAME = new Map(WORLD_CITIES.map((c) => [c.name.toLowerCase(), c]));

/** Resolves free text like "Lagos, Nigeria" to a known hub, or null when the place is not one we can pin. */
export function resolveCity(input?: string | null): City | null {
  const first = (input ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return BY_NAME.get(first) ?? null;
}

/** [lat, lng] for a known city (with a tiny deterministic jitter so companies in one city do not stack), else null. */
export function cityToCoords(city?: string | null, seed = ""): [number, number] | null {
  const c = resolveCity(city);
  if (!c) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const jx = ((h & 0xff) / 255 - 0.5) * 0.18;
  const jy = (((h >> 8) & 0xff) / 255 - 0.5) * 0.18;
  return [c.lat + jx, c.lng + jy];
}
