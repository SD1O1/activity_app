"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
  lat: number;
  lng: number;
  blurred?: boolean;
};

export default function ActivityLocationMap({
  lat,
  lng,
  blurred = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRefInstance = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapRefInstance.current) return;

    // Create map
    mapRefInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: blurred ? 12 : 16,
      interactive: !blurred,
    });

    // Add marker ONLY when exact location is allowed
    if (!blurred) {
      markerRef.current = new mapboxgl.Marker({
        color: "#000", // black pin
      })
        .setLngLat([lng, lat])
        .addTo(mapRefInstance.current);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      mapRefInstance.current?.remove();
      mapRefInstance.current = null;
    };
  }, [lat, lng, blurred]);

  return (
    <div className="mt-4 px-4">
      <div className="relative h-[220px] rounded-xl overflow-hidden">
        <div
          ref={mapRef}
          className={`h-full w-full ${blurred ? "blur-sm" : ""}`}
        />

        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-700 bg-white/50">
            Approximate location · Exact spot shared after approval
          </div>
        )}
      </div>
    </div>
  );
}