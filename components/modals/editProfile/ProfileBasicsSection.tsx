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
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <textarea
        placeholder="Bio"
        value={bio}
        onChange={(e) => onChange({ bio: e.target.value })}
        rows={3}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => onChange({ city: e.target.value })}
        className="w-full border rounded px-3 py-2 text-sm"
      />

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