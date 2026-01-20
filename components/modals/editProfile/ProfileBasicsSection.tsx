"use client";

import { getCityFromDevice } from "@/lib/location";

type Props = {
  name: string;
  bio: string;
  city: string;
  onChange: (patch: {
    name?: string;
    bio?: string;
    city?: string;
  }) => void;
};

export default function ProfileBasicsSection({
  name,
  bio,
  city,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Your name"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Tell people something about you"
        />
      </div>

      {/* City */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onChange({ city: e.target.value })}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Your city"
        />
      </div>

      {/* Location helper */}
      <button
        type="button"
        onClick={async () => {
          try {
            const { city } = await getCityFromDevice();
            onChange({ city });
          } catch {
            alert("Unable to access location");
          }
        }}
        className="text-xs underline text-gray-600"
      >
        Use my current location
      </button>
    </div>
  );
}