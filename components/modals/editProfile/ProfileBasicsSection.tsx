"use client";

import { getCityFromDevice } from "@/lib/location";

type Props = {
  avatarUrl: string;
  avatarUploading: boolean;
  avatarError: string | null;
  name: string;
  bio: string;
  city: string;
  onChange: (patch: {
    avatar_url?: string;
    name?: string;
    bio?: string;
    city?: string;
  }) => void;
  onAvatarUpload: (file: File) => Promise<void>;
};

export default function ProfileBasicsSection({
  avatarUrl,
  avatarUploading,
  avatarError,
  name,
  bio,
  city,
  onChange,
  onAvatarUpload,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Profile photo</label>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              "No photo"
            )}
          </div>

          <label className="text-xs underline cursor-pointer text-gray-700">
            {avatarUploading ? "Uploading…" : "Change photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={avatarUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await onAvatarUpload(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
      </div>

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