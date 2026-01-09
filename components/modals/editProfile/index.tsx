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
          onChange={(phone) =>
            updateForm({ phone, phone_verified: false })
          }
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
              if (!form.phone_verified) {
                alert("Please verify your phone number");
                return;
              }

              setSaving(true);

              await supabase
                .from("profiles")
                .update(form)
                .eq("id", userId);

              setSaving(false);
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