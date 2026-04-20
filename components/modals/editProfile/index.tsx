"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import ProfileBasicsSection from "./ProfileBasicsSection";
import PhoneVerificationSection from "./PhoneVerificationSection";
import EmailSecuritySection from "./EmailSecuritySection";
import PasswordSecuritySection from "./PasswordSecuritySection";

const PROFILE_PHOTOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos";

type Props = {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditProfileModal({
  userId,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    avatar_url: "",
    name: "",
    bio: "",
    city: "",
    phone: "",
    phone_verified: true,
    interests: [] as string[],
  });

  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* -------------------- load profile -------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, name, bio, city, phone_verified, interests")
        .eq("id", userId)
        .single();

      const { data: privateData, error: privateError } = await supabase
        .from("profile_private")
        .select("phone, phone_verified")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load profile", profileError);
        setLoading(false);
        return;
      }

      if (privateError) {
        console.error("Failed to load private profile", privateError);
      }

      setForm({
        avatar_url: profileData?.avatar_url ?? "",
        name: profileData?.name ?? "",
        bio: profileData?.bio ?? "",
        city: profileData?.city ?? "",
        phone: privateData?.phone ?? "",
        phone_verified:
          privateData?.phone_verified ?? profileData?.phone_verified ?? false,
        interests: profileData?.interests ?? [],
      });

      setLoading(false);
    };

    loadProfile();
  }, [userId]);

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        setAvatarError("You are not signed in. Please sign in again.");
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${auth.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setAvatarError(uploadError.message || "Failed to upload photo.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);

      if (!publicUrl) {
        setAvatarError("Photo uploaded, but URL could not be generated.");
        return;
      }

      updateForm({ avatar_url: publicUrl });
    } catch {
      setAvatarError("Unexpected upload error. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  /* -------------------- loading -------------------- */
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="rounded-2xl border border-orange-100/80 bg-white px-6 py-4 text-slate-700 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)]">
          Loading…
        </div>
      </div>
    );
  }

  /* -------------------- render -------------------- */
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] px-4 py-6">
      <div className="mx-auto w-full max-w-xl rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-6 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit profile</h2>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-orange-200 bg-white text-lg text-slate-500 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-label="Close edit profile modal"
          >
            ✕
          </button>
        </div>

        <ProfileBasicsSection
          avatarUrl={form.avatar_url}
          avatarUploading={avatarUploading}
          avatarError={avatarError}
          name={form.name}
          bio={form.bio}
          city={form.city}
          onChange={updateForm}
          onAvatarUpload={handleAvatarUpload}
        />

        <PhoneVerificationSection
          phone={form.phone}
          phoneVerified={form.phone_verified}
          error={phoneError}
          onChange={(phone) => {
            setPhoneError(undefined);
            updateForm({ phone, phone_verified: false });
          }}
          onVerified={() => updateForm({ phone_verified: true })}
        />

        <div className="mt-6 border-t border-orange-100 pt-4">
          <EmailSecuritySection />
          <PasswordSecuritySection />
        </div>

        {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={async () => {
              setSaveError(null);

              // 🔴 Required field validation
              if (!form.name.trim()) {
                setSaveError("Name cannot be empty");
                return;
              }

              if (!form.city.trim()) {
                alert("City cannot be empty");
                return;
              }

              const digitsOnly = form.phone.replace(/\D/g, "");
              if (digitsOnly.length < 10) {
                setSaveError("Enter a valid phone number");
                return;
              }

              if (!form.phone_verified) {
                setSaveError("Please verify your phone number");
                return;
              }

              setSaving(true);

              const { error: profileError } = await supabase
                .from("profiles")
                .update({
                  name: form.name.trim(),
                  avatar_url: form.avatar_url || null,
                  bio: form.bio.trim(),
                  city: form.city.trim(),
                  phone_verified: form.phone_verified,
                  interests: form.interests,
                })
                .eq("id", userId);

              if (profileError) {
                setSaving(false);
                console.error("Profile update failed", profileError);
                setSaveError("Failed to save profile. Please try again.");
                return;
              }

              const { error: privateProfileError } = await supabase
                .from("profile_private")
                .upsert(
                  {
                    id: userId,
                    phone: form.phone,
                    phone_verified: form.phone_verified,
                  },
                  { onConflict: "id" }
                );

              setSaving(false);

              if (privateProfileError) {
                if (
                  privateProfileError.code === "23505" ||
                  privateProfileError.message?.includes("profile_private_phone_unique")
                ) {
                  setPhoneError(
                    "This phone number is already associated with another account."
                  );
                  return;
                }

                console.error("Private profile update failed", privateProfileError);
                setSaveError("Failed to save profile. Please try again.");
                return;
              }

              onSaved();
            }}
            className="rounded-full border border-[#f97316] bg-[#f97316] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_26px_-18px_rgba(249,115,22,0.85)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>

        </div>
      </div>
    </div>
  );
}