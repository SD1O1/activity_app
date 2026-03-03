"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "../modals/editProfile";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import ActivityCard from "@/components/cards/ActivityCard";
import { ProfileActionsMenu } from "./ProfileActionsMenu";
import { PublicUser } from "@/types/publicUser";

const PROFILE_ACTIVITY_PAGE_SIZE = 50;
const INTEREST_STYLES = [
  "bg-orange-100 text-orange-600",
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-green-100 text-green-600",
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

  const loadProfile = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setProfile(data as ProfileData);
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
        status,
        activity_tag_relations (
          activity_tags (
            id,
            name
          )
        )
      `)
      .eq("host_id", userId)
      .not("status", "eq", "deleted")
      .order("starts_at", { ascending: true })
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (data) setHostedActivities(data as ActivitySummary[]);
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
          status,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        )
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .not("activities.status", "eq", "deleted")
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (!data) return;

    const joined = (data as ActivityMemberWithRelation[])
      .map((member) => {
        const relation = member.activities;
        return Array.isArray(relation) ? relation[0] : relation;
      })
      .filter(
        (activity): activity is ActivitySummary =>
          Boolean(activity) && activity.status !== "deleted" && activity.host_id !== userId
      );

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

    void loadAll();
  }, [userId]);

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
    return <p className="p-6 text-sm text-gray-500">Loading profile…</p>;
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-neutral-100/95 px-4 backdrop-blur-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">My Profile</h1>
        {userId && <ProfileActionsMenu isSelf profileId={userId} username={profile?.username ?? ""} />}
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-gray-300 shadow sm:h-44 sm:w-44">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl text-neutral-500">{(profile?.name ?? "U").charAt(0)}</div>
            )}
            {profile?.verified && (
              <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-blue-500 text-white">✓</span>
            )}
          </div>

          <h2 className="mt-5 text-5xl font-semibold tracking-tight text-neutral-900 sm:text-6xl">
            {profile?.name || "Your name"}, {getAge(profile?.dob)}
          </h2>

          {profile?.city && <p className="mt-2 text-3xl text-neutral-500">📍 {profile.city}</p>}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {profile?.interests?.length ? (
              profile.interests.map((interest, i) => (
                <span key={interest} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${INTEREST_STYLES[i % INTEREST_STYLES.length]}`}>
                  {interest}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-neutral-200 px-4 py-1.5 text-sm text-neutral-500">Add interests</span>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-xl leading-relaxed text-neutral-600 sm:text-2xl">
            {profile?.bio || "Tell people something about you"}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <p className="text-5xl font-semibold text-neutral-900">{hostedCount}</p>
            <p className="mt-1 text-sm font-semibold tracking-wider text-neutral-500">HOSTED</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <p className="text-5xl font-semibold text-neutral-900">{joinedCount}</p>
            <p className="mt-1 text-sm font-semibold tracking-wider text-neutral-500">JOINED</p>
          </div>
        </div>

        <button onClick={() => setIsEditOpen(true)} className="mt-5 w-full rounded-2xl bg-neutral-200 px-4 py-3 text-lg font-semibold text-neutral-800">
          Edit Profile Details
        </button>

        <section className="mt-8 border-b border-neutral-200">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActivityTab("hosted")}
              className={`border-b-4 py-3 text-xl font-semibold transition ${activityTab === "hosted" ? "border-amber-500 text-neutral-900" : "border-transparent text-neutral-400"}`}
            >
              Hosting
            </button>
            <button
              onClick={() => setActivityTab("joined")}
              className={`border-b-4 py-3 text-xl font-semibold transition ${activityTab === "joined" ? "border-amber-500 text-neutral-900" : "border-transparent text-neutral-400"}`}
            >
              Joined
            </button>
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {activeActivities.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
              {activityTab === "hosted" ? "You haven’t created any activities yet." : "You haven’t joined any activities yet."}
            </div>
          ) : (
            activeActivities.map((activity) => (
              <div key={activity.id} className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm">
                <ActivityCard
                  title={activity.title}
                  subtitle={activityTab === "hosted" ? "Hosted by you" : "You joined this activity"}
                  distance=""
                  time={new Date(activity.starts_at).toLocaleString()}
                  type={activity.type}
                  tags={activity.activity_tag_relations?.flatMap((rel) => {
                    if (!rel.activity_tags) return [];
                    return Array.isArray(rel.activity_tags) ? rel.activity_tags : [rel.activity_tags];
                  })}
                  host={activityTab === "hosted" ? profile : undefined}
                  hideHost={activityTab === "hosted"}
                  onClick={() => router.push(`/activity/${activity.id}`)}
                />
              </div>
            ))
          )}
        </section>
      </section>

      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-6 right-5 grid h-16 w-16 place-items-center rounded-full bg-amber-500 text-4xl text-white shadow-lg"
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
