// lib/location.ts

export type CityResult = {
    city: string;
  };
  
  export async function getCityFromDevice(): Promise<CityResult> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported");
    }
  
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
  
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
  
            const address = data.address || {};

            const city =
            address.city ||
            address.town ||
            address.village ||
            address.city_district ||
            address.county ||
            address.suburb ||
            address.state ||
            "";
  
            resolve({ city });
          } catch (e) {
            reject(new Error("Failed to reverse geocode"));
          }
        },
        () => reject(new Error("Location permission denied"))
      );
    });
  }  