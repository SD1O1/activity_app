"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
  lat: number;
  lng: number;
  locationName?: string;
  blurred?: boolean;
};

export default function ActivityLocationMap({ lat, lng, locationName, blurred = false }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRefInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapRefInstance.current) return;

    mapRefInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: blurred ? 12 : 14,
      interactive: !blurred,
    });

    if (!blurred) {
      markerRef.current = new mapboxgl.Marker({ color: "#ea8b22" }).setLngLat([lng, lat]).addTo(mapRefInstance.current);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      mapRefInstance.current?.remove();
      mapRefInstance.current = null;
    };
  }, [lat, lng, blurred]);

  const [title, ...rest] = (locationName ?? "").split(",");

  return (
    <section className="mt-9 px-4 sm:px-5">
      <h2 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-[2rem]">Location</h2>
      {locationName && (
        <div className="mt-2 flex items-start gap-2 text-slate-500">
          <span className="mt-0.5">📍</span>
          <div>
            <p className="text-xl font-medium text-slate-700">{title}</p>
            {rest.length > 0 && <p className="text-xl">{rest.join(",").trim()}</p>}
          </div>
        </div>
      )}

      <div className="relative mt-4 h-[220px] overflow-hidden rounded-2xl border border-neutral-200 sm:h-[280px]">
        <div ref={mapRef} className={`h-full w-full ${blurred ? "blur-sm" : ""}`} />

        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55 px-4 text-center text-sm text-gray-700">
            Approximate location · Exact spot shared after approval
          </div>
        )}
      </div>
    </section>
  );
}
