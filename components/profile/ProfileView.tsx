"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "../modals/editProfile";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type ProfileRecord = {
  id: string;
  name: string | null;
  dob: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  verified?: boolean | null;
};

type ActivityItem = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  location_name: string | null;
  host_id: string;
  status?: string | null;
};

const PROFILE_ACTIVITY_PAGE_SIZE = 50;

function getAge(dob?: string | null) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ProfileView() {
  const router = useRouter();
  const { user } = useClientAuthProfile();
  const userId = user?.id;

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [hostedActivities, setHostedActivities] = useState<ActivityItem[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"hosted" | "joined">("hosted");

  const loadProfile = async () => {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data as ProfileRecord);
  };

  const loadHostedActivities = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("activities")
      .select(`
        id,
        title,
        type,
        starts_at,
        location_name,
        host_id,
        status
      `)
      .eq("host_id", userId)
      .not("status", "eq", "deleted")
      .order("starts_at", { ascending: true })
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    setHostedActivities((data as ActivityItem[]) ?? []);
  };

  const loadJoinedActivities = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("activity_members")
      .select(`
        activity_id,
        activities(
          id,
          title,
          type,
          starts_at,
          location_name,
          host_id,
          status
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .not("activities.status", "eq", "deleted")
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    const joined = (data ?? [])
      .map((member) => {
        const relation = member.activities as unknown;
        return Array.isArray(relation) ? (relation[0] as ActivityItem) : (relation as ActivityItem);
      })
      .filter((activity) => activity && activity.status !== "deleted" && activity.host_id !== userId);

    setJoinedActivities(joined);
  };

  useEffect(() => {
    if (!userId) return;
    const loadAll = async () => {
      setLoading(true);
      await loadProfile();
      await loadHostedActivities();
      await loadJoinedActivities();
      setLoading(false);
    };
    loadAll();
  }, [userId]);

  const age = useMemo(() => getAge(profile?.dob), [profile?.dob]);
  const visibleActivities = activityTab === "hosted" ? hostedActivities : joinedActivities;

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading profile…</p>;

  return (
    <main className="mobile-app-container pb-24 text-[#121826]">
      <div className="mx-auto w-full max-w-full">
        <section className="flex items-center justify-between border-b border-[#e5e7eb] py-4">
          <h1 className="text-[20px] md:text-[24px] font-semibold leading-none">My Profile</h1>
          <button type="button" className="text-[14px] leading-none text-[#6b7280]">⋮</button>
        </section>

        <section className="pt-6 text-center max-w-2xl mx-auto">
          <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[14px] text-gray-500">{(profile?.name || "U").charAt(0)}</div>
            )}
            {profile?.verified && <div className="absolute bottom-2 right-2 rounded-full bg-[#2d9bf0] px-2 py-1 text-white">✓</div>}
          </div>

          <h2 className="mt-5 text-[24px] font-semibold leading-tight">{profile?.name || "Your name"}{age ? `, ${age}` : ""}</h2>
          {profile?.city && <p className="mt-1 text-[14px] text-[#6b7280]">📍 {profile.city}</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(profile?.interests ?? []).map((interest) => (
              <span key={interest} className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#ece8ff", color: "#6d28d9" }}>
                {interest}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-4 max-w-[90%] text-[14px] leading-snug text-[#6b7280]">{profile?.bio || "Tell people something about you"}</p>

          <button
            onClick={() => setIsEditOpen(true)}
            className="mt-6 w-full rounded-2xl bg-[#eef0f3] px-4 py-4 text-[14px] font-semibold"
          >
            Edit Profile Details
          </button>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="app-card px-4 py-5 text-center shadow-sm">
            <p className="text-[24px] font-bold">{hostedActivities.length}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-wide text-[#6b7280]">HOSTED</p>
          </div>
          <div className="app-card px-4 py-5 text-center shadow-sm">
            <p className="text-[24px] font-bold">{joinedActivities.length}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-wide text-[#6b7280]">JOINED</p>
          </div>
        </section>

        <section className="mt-6 border-b border-[#d9dce2]">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActivityTab("hosted")}
              className={`pb-3 text-[14px] font-semibold ${activityTab === "hosted" ? "border-b-4 border-[#f08f26] text-[#111827]" : "text-[#9ca3af]"}`}
            >
              Hosting
            </button>
            <button
              onClick={() => setActivityTab("joined")}
              className={`pb-3 text-[14px] font-semibold ${activityTab === "joined" ? "border-b-4 border-[#f08f26] text-[#111827]" : "text-[#9ca3af]"}`}
            >
              Joined
            </button>
          </div>
        </section>

        <section className="space-y-4 pt-5">
          {visibleActivities.length === 0 ? (
            <div className="app-card p-5 text-xl text-[#6b7280]">
              {activityTab === "hosted" ? "You haven’t created any activities yet." : "You haven’t joined any activities yet."}
            </div>
          ) : (
            visibleActivities.map((activity) => {
              const isPast = activity.status === "completed";
              return (
                <div key={activity.id} className="app-card p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e3cf] text-[14px]">☕</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[20px] font-semibold">{activity.title}</h3>
                      <p className="mt-1 text-[14px] text-[#6b7280]">🕒 {formatWhen(activity.starts_at)}</p>
                      <p className="mt-2 truncate text-[14px] text-[#6b7280]">📍 {activity.location_name || "Location TBD"}</p>
                    </div>
                    {isPast && <span className="rounded-xl bg-[#f3f4f6] px-3 py-1 text-sm font-semibold text-[#9ca3af]">DONE</span>}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/activity/${activity.id}`)}
                      className={`flex-1 rounded-xl py-2 text-[14px] font-semibold ${isPast ? "bg-[#e5e7eb] text-[#6b7280]" : "bg-[#f08f26] text-white"}`}
                    >
                      {isPast ? "View Recap" : activityTab === "hosted" ? "Manage" : "Open"}
                    </button>
                    {!isPast && <button className="rounded-xl bg-[#eef0f3] px-3 py-2 text-xl">💬</button>}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-[#f08f26] text-[20px] text-white shadow-lg"
      >
        +
      </button>

      {isEditOpen && userId && (
        <EditProfileModal
          userId={userId}
          onClose={() => setIsEditOpen(false)}
          onSaved={async () => {
            setIsEditOpen(false);
            await loadProfile();
            await loadHostedActivities();
            await loadJoinedActivities();
          }}
        />
      )}
    </main>
  );
}