"use client";

import { useEffect, useState } from "react";

type Props = {
  startsAt: string;
  location: string;
  costRule: string;
  memberCount?: number;
  maxMembers?: number;
  showMemberProgress?: boolean;
  lat?: number | null;
  lng?: number | null;
};

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function ActivityMeta({ startsAt, location, costRule, memberCount, maxMembers, showMemberProgress = true, lat, lng }: Props) {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState(
    typeof navigator !== "undefined" ? !navigator.geolocation : false
  );

  useEffect(() => {
    if (lat == null || lng == null || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = getDistanceKm(pos.coords.latitude, pos.coords.longitude, lat, lng);
        setDistanceKm(d);
        setDistanceError(false);
      },
      () => {
        setDistanceError(true);
      }
    );
  }, [lat, lng]);

  return (
    <section className="mt-6 px-4 space-y-2 text-sm text-gray-700">
      <p>🕒 {new Date(startsAt).toLocaleString()}</p>
      <p>📍 {location}</p>

      {showMemberProgress && typeof memberCount === "number" && typeof maxMembers === "number" && (
        <p>
          👥 {memberCount} / {maxMembers} joined
        </p>
      )}

      {lat != null && lng != null && (
        <p>
          📏 {distanceKm != null ? `${distanceKm.toFixed(1)} km away` : distanceError ? "Distance unavailable" : "Calculating distance…"}
        </p>
      )}

      <p>💸 {costRule}</p>
    </section>
  );
}