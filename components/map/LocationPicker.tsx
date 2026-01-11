"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type LocationPickerProps = {
  onSelect: (location: {
    lat: number;
    lng: number;
    name: string;
    city: string;
  }) => void;
};

type CityResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

type AreaResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

function getCityBBox(center: [number, number]) {
  const [lng, lat] = center;

  // ~40–50km radius (safe for Indian cities)
  const deltaLng = 0.4;
  const deltaLat = 0.4;

  return [
    lng - deltaLng, // west
    lat - deltaLat, // south
    lng + deltaLng, // east
    lat + deltaLat, // north
  ];
}

export default function LocationPicker({ onSelect }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const isSelectingAreaRef = useRef(false);

  const [step, setStep] = useState<"city" | "area">("city");

  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);

  const [areaQuery, setAreaQuery] = useState("");
  const [areaResults, setAreaResults] = useState<AreaResult[]>([]);

  const [debouncedAreaQuery, setDebouncedAreaQuery] = useState("");

  const [areaSelected, setAreaSelected] = useState(false);

  const [center, setCenter] = useState({
    lat: 19.076,
    lng: 72.8777,
  });

  useEffect(() => {
    const value = areaQuery.trim();
  
    if (value.length < 2) {
      setDebouncedAreaQuery("");
      return;
    }
  
    const timeout = setTimeout(() => {
      setDebouncedAreaQuery(value);
    }, 300);
  
    return () => clearTimeout(timeout);
  }, [areaQuery]);  

  /* INIT MAP (only once) */
  useEffect(() => {
    if (!mapRef.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 12,
    });

    map.current.on("moveend", () => {
      const c = map.current!.getCenter();
      setCenter({ lat: c.lat, lng: c.lng });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  /* SEARCH CITY */
  useEffect(() => {
    if (!cityQuery.trim() || step !== "city") {
      setCityResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        cityQuery
      )}.json?access_token=${
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      }&types=place&country=IN&limit=5`;

      const res = await fetch(url);
      const data = await res.json();
      setCityResults(data.features || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [cityQuery, step]);

  /* SEARCH AREA (LOCKED TO CITY) */
  useEffect(() => {
    if (
      step !== "area" ||
      !selectedCity ||
      !debouncedAreaQuery
    ) {
      setAreaResults([]);
      return;
    }
  
    const fetchAreas = async () => {
      try {
        const [cityLng, cityLat] = selectedCity.center;
        const bbox = getCityBBox([cityLng, cityLat]);
  
        const url =
          "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
          encodeURIComponent(debouncedAreaQuery) +
          ".json" +
          "?access_token=" + process.env.NEXT_PUBLIC_MAPBOX_TOKEN +
          "&country=IN" +
          "&types=poi,address,locality,neighborhood" +
          "&bbox=" + bbox.join(",") +
          "&proximity=" + cityLng + "," + cityLat +
          "&limit=8";
  
        const res = await fetch(url);
        const data = await res.json();
        setAreaResults(data.features || []);
      } catch (err) {
        console.error("Area search error", err);
      }
    };
  
    fetchAreas();
  }, [debouncedAreaQuery, step, selectedCity]);
  
  /* SELECT CITY */
  const selectCity = (city: CityResult) => {
    const [lng, lat] = city.center;

    map.current?.flyTo({
      center: [lng, lat],
      zoom: 12,
    });

    setCenter({ lat, lng });
    setSelectedCity(city);
    setStep("area");
    setCityResults([]);
  };

  /* SELECT AREA (OPTIONAL) */
  const selectArea = (area: AreaResult) => {
    isSelectingAreaRef.current = true;
    setAreaSelected(true);
  
    const [lng, lat] = area.center;
  
    map.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
    });
  
    setCenter({ lat, lng });
    setAreaQuery(area.place_name);
    setAreaResults([]);
    setDebouncedAreaQuery("");
  };  

  /* CONFIRM */
  const confirmLocation = () => {
    if (!selectedCity) return;

    onSelect({
      lat: center.lat,
      lng: center.lng,
      name:
        areaQuery ||
        `Near ${selectedCity.place_name}`,
      city: selectedCity.place_name,
    });
  };

  return (
    <div className="space-y-4">
      {/* STEP 1: CITY */}
      {step === "city" && (
        <>
          <h2 className="text-sm font-medium">
            Choose city
          </h2>

          <input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Search city (e.g. Pune)"
            className="w-full rounded-xl border px-4 py-3"
          />

          {cityResults.length > 0 && (
            <div className="rounded-xl border bg-white shadow">
              {cityResults.map((city) => (
                <button
                  key={city.id}
                  onClick={() => selectCity(city)}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {city.place_name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* STEP 2: AREA + PIN */}
      {step === "area" && selectedCity && (
        <>
          <h2 className="text-sm font-medium">
            Select area in {selectedCity.place_name}
          </h2>

          <input
            value={areaQuery}
            onChange={(e) => {
              setAreaQuery(e.target.value);
              setAreaSelected(false); // 👈 allow list again
            }}
            placeholder="Search local area (optional)"
            className="w-full rounded-xl border px-4 py-3"
          />

          <p className="text-xs text-gray-500">
            Adjust the pin to choose exact meeting point
          </p>

          {!areaSelected && areaResults.length > 0 && (
            <div className="rounded-xl border bg-white shadow">
              {areaResults.map((area) => (
                <button
                  key={area.id}
                  onClick={() => selectArea(area)}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {area.place_name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* MAP */}
      <div className="relative h-[300px] rounded-xl overflow-hidden">
        <div ref={mapRef} className="h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-4 w-4 rounded-full bg-black" />
        </div>
      </div>

      {/* CONFIRM */}
      {step === "area" && (
        <button
          onClick={confirmLocation}
          className="w-full rounded-xl bg-black py-3 text-white font-medium"
        >
          Confirm location
        </button>
      )}
    </div>
  );
}