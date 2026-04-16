"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "../modals/editProfile";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { PublicUser } from "@/types/publicUser";

const PROFILE_ACTIVITY_PAGE_SIZE = 50;
const INTEREST_STYLES = [
  "bg-orange-100 text-orange-600",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-200 text-orange-800",
  "bg-orange-50 text-orange-700",
];

type ActivityTag = { id: string; name: string };
type ActivityTagRelation = { activity_tags: ActivityTag | ActivityTag[] | null };

type ActivitySummary = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  location_name: string;
  host_id: string;
  status: string;
  activity_tag_relations?: ActivityTagRelation[] | null;
};

type ProfileData = PublicUser & {
  dob?: string | null;
  city?: string | null;
  bio?: string | null;
  interests?: string[] | null;
};

type ActivityMemberWithRelation = {
  activities: ActivitySummary | ActivitySummary[] | null;
};

function formatActivityTime(startsAt: string) {
  const date = new Date(startsAt);
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function getActivityIcon(type: "group" | "one-on-one", status: string) {
  if (status === "completed") return { icon: "🎬", box: "bg-orange-100 text-orange-700" };
  return type === "group"
    ? { icon: "☕", box: "bg-orange-100 text-[#ee8c2b]" }
    : { icon: "🏋️", box: "bg-amber-100 text-amber-700" };
}

export default function ProfileView() {
  const router = useRouter();
  const { user } = useClientAuthProfile();
  const userId = user?.id;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hostedActivities, setHostedActivities] = useState<ActivitySummary[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"hosted" | "joined">("hosted");

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data as ProfileData);
  }, [userId]);

  const loadHostedActivities = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("activities")
      .select(
        `
        id,
        title,
        type,
        starts_at,
        location_name,
        host_id,
        status,
        activity_tag_relations (
          activity_tags (
            id,
            name
          )
        )
      `
      )
      .eq("host_id", userId)
      .not("status", "eq", "deleted")
      .order("starts_at", { ascending: true })
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (data) setHostedActivities(data as ActivitySummary[]);
  }, [userId]);

  const loadJoinedActivities = useCallback(async () => {
    if (!userId) return;

    const currentUserId = userId;
    const { data } = await supabase
      .from("activity_members")
      .select(
        `
        activity_id,
        activities(
          id,
          title,
          type,
          starts_at,
          location_name,
          host_id,
          status,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        )
      `
      )
      .eq("user_id", currentUserId)
      .eq("status", "active")
      .not("activities.status", "eq", "deleted")
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (!data) return;

    const joined = (data as ActivityMemberWithRelation[])
      .map((member) => {
        const relation = member.activities;
        return (Array.isArray(relation) ? relation[0] : relation) ?? null;
      })
      .filter((activity): activity is ActivitySummary => {
        if (!activity) return false;
        return activity.status !== "deleted" && activity.host_id !== currentUserId;
      });

    setJoinedActivities(joined);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadAll = async () => {
      setLoading(true);
      await loadProfile();
      await loadHostedActivities();
      await loadJoinedActivities();
      setLoading(false);
    };

    void loadAll();
  }, [userId, loadProfile, loadHostedActivities, loadJoinedActivities]);

  const getAge = (dob?: string | null) => {
    if (!dob) return "--";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const hostedCount = useMemo(() => hostedActivities.length, [hostedActivities.length]);
  const joinedCount = useMemo(() => joinedActivities.length, [joinedActivities.length]);
  const activeActivities = activityTab === "hosted" ? hostedActivities : joinedActivities;

  if (loading) {
    return <p className="p-6 text-sm text-slate-500">Loading profile…</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] pb-28">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-orange-100/80 bg-white/95 px-5 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">My Profile</h1>
        {userId && <ProfileActionsMenu isSelf profileId={userId} username={profile?.username ?? ""} />}
      </header>

      <section className="mx-auto w-full max-w-3xl px-5 py-6">
        <div className="rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.55)] sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 shadow-[0_18px_34px_-24px_rgba(249,115,22,0.55)] sm:h-44 sm:w-44">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
              ) : (
                <div className="grid h-full w-full place-items-center text-4xl text-slate-500">{(profile?.name ?? "U").charAt(0)}</div>
              )}
              {profile?.verified && (
                <span className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#1d9bf0] text-lg text-white">
                  ✪
                </span>
              )}
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {profile?.name || "Your name"}, {getAge(profile?.dob)}
            </h2>

            {profile?.city && <p className="mt-2 text-lg font-medium text-slate-500 sm:text-2xl">📍 {profile.city}</p>}

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {profile?.interests?.length ? (
                profile.interests.map((interest, i) => (
                  <span key={interest} className={`rounded-full px-4 py-1.5 text-sm font-bold ${INTEREST_STYLES[i % INTEREST_STYLES.length]}`}>
                    {interest}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-neutral-200 px-4 py-1.5 text-sm text-neutral-500">Add interests</span>
              )}
            </div>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
              {profile?.bio || "Tell people something about you"}
            </p>

            <div className="mt-8 grid w-full grid-cols-2 gap-4">
              <div className="rounded-3xl border border-orange-100/80 bg-white p-6 text-center shadow-[0_16px_32px_-28px_rgba(15,23,42,0.55)]">
                <p className="text-4xl font-bold text-slate-900 sm:text-5xl">{hostedCount}</p>
                <p className="mt-1 text-sm font-bold tracking-wider text-slate-500">HOSTED</p>
              </div>
              <div className="rounded-3xl border border-orange-100/80 bg-white p-6 text-center shadow-[0_16px_32px_-28px_rgba(15,23,42,0.55)]">
                <p className="text-4xl font-bold text-slate-900 sm:text-5xl">{joinedCount}</p>
                <p className="mt-1 text-sm font-bold tracking-wider text-slate-500">JOINED</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              className="mt-5 w-full rounded-2xl border border-orange-200 bg-orange-50/70 px-4 py-3 text-xl font-bold text-slate-900 transition-colors hover:bg-orange-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              Edit Profile Details
            </button>

            <section className="mt-8 w-full border-b border-orange-100/80">
              <div className="grid grid-cols-2">
                <button
                  onClick={() => setActivityTab("hosted")}
                  className={`border-b-[3px] py-3 text-lg font-bold transition sm:text-2xl ${activityTab === "hosted" ? "border-[#f97316] text-slate-900" : "border-transparent text-slate-400"}`}
                >
                  Hosting
                </button>
                <button
                  onClick={() => setActivityTab("joined")}
                  className={`border-b-[3px] py-3 text-lg font-bold transition sm:text-2xl ${activityTab === "joined" ? "border-[#f97316] text-slate-900" : "border-transparent text-slate-400"}`}
                >
                  Joined
                </button>
              </div>
            </section>

            <section className="mt-5 w-full space-y-4">
              {activeActivities.length === 0 ? (
                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/40 p-4 text-sm text-slate-500">
                  {activityTab === "hosted" ? "You haven’t created any activities yet." : "You haven’t joined any activities yet."}
                </div>
              ) : (
                activeActivities.map((activity) => {
                  const activityTheme = getActivityIcon(activity.type, activity.status);
                  const isDone = activity.status === "completed";

                  return (
                    <button
                      key={activity.id}
                      onClick={() => router.push(`/activity/${activity.id}`)}
                      className="w-full rounded-3xl border border-orange-100/80 bg-white p-4 text-left shadow-[0_18px_34px_-30px_rgba(15,23,42,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`grid h-16 w-16 place-items-center rounded-2xl text-2xl ${activityTheme.box}`}>{activityTheme.icon}</div>
                          <div>
                            <h3 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{activity.title}</h3>
                            <p className="mt-1 text-sm text-slate-500 sm:text-base">🕒 {formatActivityTime(activity.starts_at)}</p>
                          </div>
                        </div>
                        {isDone && <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold uppercase text-slate-500">Done</span>}
                      </div>

                      <p className="mt-3 pl-[4.8rem] text-sm text-slate-500 sm:text-base">📍 {activity.location_name || "Location TBD"}</p>

                      <div className="mt-4 flex items-center gap-2 pl-[4.8rem]">
                        <span className={`flex-1 rounded-xl py-2 text-center text-base font-bold sm:text-xl ${isDone ? "bg-orange-100 text-slate-500" : "bg-[#f97316] text-white"}`}>
                          {isDone ? "View Recap" : activityTab === "hosted" ? "Manage" : "View"}
                        </span>
                        {!isDone && (
                          <span className="grid h-11 w-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-xl text-slate-600">💬</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </section>

      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-6 right-5 grid h-16 w-16 place-items-center rounded-full bg-[#f97316] text-4xl text-white shadow-lg shadow-orange-400/30 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        aria-label="Create activity"
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
