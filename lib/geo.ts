// lib/geo.ts

type LatLng = {
    lat: number;
    lng: number;
  };
  
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
  
  // 1️⃣ Convert city → lat/lng using Mapbox
  export async function cityToLatLng(
    city: string
  ): Promise<LatLng | null> {
    if (!city) return null;
  
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      city
    )}.json?limit=1&access_token=${MAPBOX_TOKEN}`;
  
    const res = await fetch(url);
    if (!res.ok) return null;
  
    const data = await res.json();
    if (!data.features || data.features.length === 0)
      return null;
  
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  }
  
  // 2️⃣ Bounding box for distance filtering
  export function getBoundingBox(
    lat: number,
    lng: number,
    distanceKm: number
  ) {
    const earthRadiusKm = 6371;
  
    const latDelta =
      (distanceKm / earthRadiusKm) * (180 / Math.PI);
    const lngDelta =
      (distanceKm /
        (earthRadiusKm * Math.cos((lat * Math.PI) / 180))) *
      (180 / Math.PI);
  
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }  