import "server-only";

type GeoPoint = { lat: number; lng: number };

const cache = new Map<string, GeoPoint | null>();

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const key = address.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "by,ru,kz,ua");

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ReSchoolPilot/1.0 (privacy@reschool.demo)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }

    const rows = (await response.json()) as { lat?: string; lon?: string }[];
    const first = rows[0];
    if (!first?.lat || !first?.lon) {
      cache.set(key, null);
      return null;
    }

    const point = { lat: Number(first.lat), lng: Number(first.lon) };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      cache.set(key, null);
      return null;
    }

    cache.set(key, point);
    return point;
  } catch {
    cache.set(key, null);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
