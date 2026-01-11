"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Activity = {
  id: string;
  public_lat: number | null;
  public_lng: number | null;
};

type Props = {
  activities: Activity[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
};

export default function ActivitiesMap({
  activities,
  activeId,
  onSelect,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // INIT MAP
  useEffect(() => {
    if (!mapRef.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [78.9629, 20.5937], // India center (fallback)
      zoom: 4,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // ADD / UPDATE PINS
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    activities.forEach((activity) => {
      if (
        activity.public_lat == null ||
        activity.public_lng == null
      )
        return;

      const el = document.createElement("div");
      el.className = "w-3 h-3 rounded-full bg-black cursor-pointer";

      if (activity.id === activeId) {
        el.className =
          "w-4 h-4 rounded-full bg-black ring-4 ring-black/30";
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          activity.public_lng,
          activity.public_lat,
        ])
        .addTo(map.current!);

      el.onclick = () => onSelect?.(activity.id);

      markersRef.current.push(marker);
      bounds.extend([
        activity.public_lng,
        activity.public_lat,
      ]);
    });

    // 👇 THIS IS THE KEY PART YOU WERE MISSING
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
      });
    }
  }, [activities, activeId, onSelect]);

  return (
    <div className="h-[45vh] w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}