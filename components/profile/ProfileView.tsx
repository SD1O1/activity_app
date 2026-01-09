"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "../modals/editProfile";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

export default function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const { user } = useClientAuthProfile();
  const userId = user?.id;

  const loadProfile = async () => {
    if (!userId) return;
  
    setLoading(true);
  
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
  
    if (error) {
      console.error("Failed to load profile:", error);
      setLoading(false);
      return;
    }
  
    setProfile(data);
    setLoading(false);
  };  

  useEffect(() => {
    loadProfile();
  }, [userId]);  

  const refetchProfile = async () => {
    await loadProfile();
  };

  const getAge = (dob?: string) => {
    if (!dob) return "--";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <main className="min-h-screen bg-white relative">
      {/* Profile header */}
      <section className="flex flex-col items-center px-4 py-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-300 overflow-hidden">
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {profile?.verification_status === "verified" && (
            <span className="absolute bottom-0 right-0 bg-black text-white text-xs px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">
            Loading profile…
          </p>
        ) : (
          <>
            <h2 className="mt-4 text-lg font-semibold">
              {profile?.name || "Your name"}, {getAge(profile?.dob)}
            </h2>

            <p className="mt-1 text-sm text-gray-600 text-center">
              {profile?.bio || "Tell people something about you"}
            </p>
          </>
        )}
      </section>

      {/* Interests */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-2">
          Interests
        </h3>

        {profile?.interests?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest: string) => (
              <span
                key={interest}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No interests added yet
          </p>
        )}

        <p className="mt-3 text-xs text-gray-400">
          All users verify their phone numbers. Profile photo verification is shown by a checkmark.
        </p>
      </section>

      {/* Activities Created */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">
            Activities Created
          </h3>
          <span className="text-xs text-gray-500">
            0
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border p-3 text-sm text-gray-500">
            No activities created yet
          </div>
        </div>
      </section>

      {/* Activities Completed */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">
            Activities Completed
          </h3>
          <span className="text-xs text-gray-500">
            0
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-400">
            No completed activities yet
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Completed activities help others understand how active you are on the app.
        </p>
      </section>

      {/* Create activity */}
      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-black text-white text-2xl flex items-center justify-center"
      >
        +
      </button>

      {/* Edit profile */}
      <button
        onClick={() => setIsEditOpen(true)}
        className="mt-3 text-sm font-semibold text-black underline"
      >
        Edit profile
      </button>

      {isEditOpen && userId && (
        <EditProfileModal
          userId={userId}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => {
            setIsEditOpen(false);
            refetchProfile();
          }}
        />
      )}

    </main>
  );
}