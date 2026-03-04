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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function ActivityMeta({ startsAt, costRule, memberCount, maxMembers, showMemberProgress = true, lat, lng }: Props) {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState(typeof navigator !== "undefined" ? !navigator.geolocation : false);

  useEffect(() => {
    if (lat == null || lng == null || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDistanceKm(getDistanceKm(pos.coords.latitude, pos.coords.longitude, lat, lng));
        setDistanceError(false);
      },
      () => setDistanceError(true)
    );
  }, [lat, lng]);

  const eventDate = new Date(startsAt);

  return (
    <section className="mt-5 px-4 sm:px-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard icon="📅" label="Date" value={eventDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} />
        <InfoCard icon="🕙" label="Time" value={eventDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} />
        <InfoCard icon="💸" label="Cost" value={costRule} />
        {showMemberProgress && typeof memberCount === "number" && typeof maxMembers === "number" ? (
          <InfoCard icon="👥" label="Group Activity" value={`${memberCount}/${maxMembers} Joined`} />
        ) : (
          <InfoCard icon="🙋" label="1-on-1 Activity" value="Private" />
        )}
      </div>

      {lat != null && lng != null && (
        <p className="mt-2 text-sm text-neutral-500">
          {distanceKm != null
            ? `About ${distanceKm.toFixed(1)} km away from your location`
            : distanceError
              ? "Distance unavailable"
              : "Calculating distance..."}
        </p>
      )}
    </section>
  );
}

type CardProps = {
  icon: string;
  label: string;
  value: string;
};

function InfoCard({ icon, label, value }: CardProps) {
  return (
    <div className="rounded-2xl bg-neutral-100 p-4">
      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-sm">{icon}</div>
      <p className="text-base text-neutral-500">{label}</p>
      <p className="text-[1.75rem] font-semibold leading-tight text-neutral-900">{value}</p>
    </div>
  );
}
