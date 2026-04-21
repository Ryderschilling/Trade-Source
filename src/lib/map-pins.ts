import { createServiceClient } from "@/lib/supabase/server";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
// Bounding box for NW Florida coast
const BBOX = "-88.0,29.5,-85.0,30.9";

async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=${BBOX}&limit=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const center: [number, number] | undefined = data.features?.[0]?.center;
    return center ?? null;
  } catch {
    return null;
  }
}

export interface MapPin {
  id: string;
  name: string;
  trade: string;
  slug: string;
  lng: number;
  lat: number;
}

function spreadCollisions(pins: MapPin[]): MapPin[] {
  // Group by position rounded to ~100m grid
  const groups = new Map<string, MapPin[]>();
  for (const pin of pins) {
    const key = `${pin.lng.toFixed(3)},${pin.lat.toFixed(3)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pin);
  }

  const result: MapPin[] = [];
  const RADIUS = 0.003; // ~300m spread
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.forEach((pin, i) => {
        const angle = (2 * Math.PI * i) / group.length;
        result.push({
          ...pin,
          lng: pin.lng + RADIUS * Math.cos(angle),
          lat: pin.lat + RADIUS * Math.sin(angle),
        });
      });
    }
  }
  return result;
}

export async function getContractorPins(): Promise<MapPin[]> {
  const supabase = await createServiceClient();

  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, business_name, slug, address, city, state, zip, lat, lng, categories(name)")
    .eq("status", "active");

  if (!contractors?.length) return [];

  const pins: MapPin[] = [];
  const updates: { id: string; lat: number; lng: number }[] = [];

  for (const c of contractors) {
    let lng = c.lng;
    let lat = c.lat;

    if (lng == null || lat == null) {
      const query = c.address
        ? `${c.address}, ${c.city}, ${c.state}${c.zip ? " " + c.zip : ""}`
        : `${c.city}, ${c.state}`;
      const coords = await geocode(query);
      if (coords) {
        [lng, lat] = coords;
        updates.push({ id: c.id, lat, lng });
      }
    }

    if (lng != null && lat != null) {
      const category = c.categories as { name: string } | null;
      pins.push({ id: c.id, name: c.business_name, trade: category?.name ?? "", slug: c.slug, lng, lat });
    }
  }

  // Persist geocoded coordinates so future loads are instant
  await Promise.all(
    updates.map(({ id, lat, lng }) =>
      supabase.from("contractors").update({ lat, lng }).eq("id", id)
    )
  );

  return spreadCollisions(pins);
}
