"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import ProfileBasicsSection from "./ProfileBasicsSection";
import PhoneVerificationSection from "./PhoneVerificationSection";
import EmailSecuritySection from "./EmailSecuritySection";
import PasswordSecuritySection from "./PasswordSecuritySection";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { showToast } = useToast();

  /* -------------------- load profile -------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, name, bio, city, phone, phone_verified, interests")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Failed to load profile", error);
        setLoading(false);
        return;
      }

      setForm({
        avatar_url: data?.avatar_url ?? "",
        name: data?.name ?? "",
        bio: data?.bio ?? "",
        city: data?.city ?? "",
        phone: data?.phone ?? "",
        phone_verified: data?.phone_verified ?? false,
        interests: data?.interests ?? [],
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
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">Loading…</div>
      </div>
    );
  }

  /* -------------------- render -------------------- */
  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto px-4 py-6 flex items-start sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Edit profile</h2>

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

        <div className="mt-6 border-t pt-4">
          <EmailSecuritySection />
          <PasswordSecuritySection />
        </div>

        {saveError ? <p className="mt-4 text-sm text-red-600">{saveError}</p> : null}

        <div className="mt-6 flex justify-between">
          <button onClick={onClose} className="text-sm text-gray-500">
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

              const { error } = await supabase
                .from("profiles")
                .update({
                  name: form.name.trim(),
                  avatar_url: form.avatar_url || null,
                  bio: form.bio.trim(),
                  city: form.city.trim(),
                  phone: form.phone,
                  phone_verified: form.phone_verified,
                  interests: form.interests,
                })
                .eq("id", userId);

              setSaving(false);

              if (error) {
                if (
                  error.code === "23505" ||
                  error.message?.includes("profiles_phone_unique")
                ) {
                  setPhoneError(
                    "This phone number is already associated with another account."
                  );
                  return;
                }

                console.error("Profile update failed", error);
                setSaveError("Failed to save profile. Please try again.");
                return;
              }

              onSaved();
            }}
            className="text-sm font-semibold text-black"
          >
            Save
          </button>

        </div>
      </div>
    </div>
  );
}