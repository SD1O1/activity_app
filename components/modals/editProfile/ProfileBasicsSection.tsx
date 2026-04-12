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
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile photo</label>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-orange-200 bg-orange-50 text-xs text-slate-500">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              "No photo"
            )}
          </div>

          <label className="cursor-pointer rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50">
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
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          placeholder="Your name"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          placeholder="Tell people something about you"
        />
      </div>

      {/* City */}
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onChange({ city: e.target.value })}
          className="w-full rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
        className="text-xs font-medium text-[#f97316] underline decoration-orange-300 underline-offset-2 transition-colors hover:text-[#ea6a11]"
      >
        Use my current location
      </button>
    </div>
  );
}