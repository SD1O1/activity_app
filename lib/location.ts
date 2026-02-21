// lib/location.ts

export type CityResult = {
  city: string;
};

const MAPBOX_TOKEN =
process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export async function getCityFromDevice(): Promise<CityResult> {
  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token is missing");
  }
  
  if (!navigator.geolocation) {
    throw new Error("Geolocation not supported");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&access_token=${MAPBOX_TOKEN}`
          );

          if (!res.ok) {
            throw new Error("Mapbox reverse geocoding failed");
          }

          const data = await res.json();

          const place = data.features?.[0];
          const city = place?.text || "";

          if (!city) {
            throw new Error("City not found");
          }

          resolve({ city });
        } catch (e) {
          reject(
            e instanceof Error
              ? e
              : new Error("Failed to detect city")
          );
        }
      },
      () => reject(new Error("Location permission denied"))
    );
  });
}