"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type MapProps = {
  center: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  markers?: {
    id: string;
    lat: number;
    lng: number;
  }[];
  height?: string;
};

export default function Map({
  center,
  zoom = 12,
  markers = [],
  height = "100%",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom,
    });

    // Disable rotation (better UX)
    mapInstance.current.dragRotate.disable();
    mapInstance.current.touchZoomRotate.disableRotation();

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    markers.forEach((marker) => {
      new mapboxgl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapInstance.current!);
    });
  }, [markers]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height }}
      className="rounded-xl overflow-hidden"
    />
  );
}