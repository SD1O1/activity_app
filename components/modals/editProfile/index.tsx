"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import ProfileBasicsSection from "./ProfileBasicsSection";
import PhoneVerificationSection from "./PhoneVerificationSection";
import EmailSecuritySection from "./EmailSecuritySection";
import PasswordSecuritySection from "./PasswordSecuritySection";

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
    name: "",
    bio: "",
    city: "",
    phone: "",
    phone_verified: true,
    interests: [] as string[],
  });

  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);

  /* -------------------- load profile -------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, bio, city, phone, phone_verified, interests")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Failed to load profile", error);
        setLoading(false);
        return;
      }

      setForm({
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Edit profile</h2>

        <ProfileBasicsSection
          name={form.name}
          bio={form.bio}
          city={form.city}
          onChange={updateForm}
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

        <div className="mt-6 flex justify-between">
          <button onClick={onClose} className="text-sm text-gray-500">
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={async () => {
              // 🔴 Required field validation
              if (!form.name.trim()) {
                alert("Name cannot be empty");
                return;
              }

              if (!form.city.trim()) {
                alert("City cannot be empty");
                return;
              }

              const digitsOnly = form.phone.replace(/\D/g, "");
              if (digitsOnly.length < 10) {
                alert("Enter a valid phone number");
                return;
              }

              if (!form.phone_verified) {
                alert("Please verify your phone number");
                return;
              }

              setSaving(true);

              const { error } = await supabase
                .from("profiles")
                .update({
                  name: form.name.trim(),
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
                alert("Failed to save profile. Please try again.");
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