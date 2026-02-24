"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import EditProfileModal from "../modals/editProfile";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import ActivityCard from "@/components/cards/ActivityCard";

const PROFILE_ACTIVITY_PAGE_SIZE = 50;

export default function ProfileView() {
  const router = useRouter();
  const { user } = useClientAuthProfile();
  const userId = user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [hostedActivities, setHostedActivities] = useState<any[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [activityTab, setActivityTab] = useState<"hosted" | "joined">("hosted");

  /* -------------------- LOAD PROFILE -------------------- */
  const loadProfile = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setProfile(data);
  };

  /* -------------------- LOAD HOSTED ACTIVITIES -------------------- */
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
      .neq("status", "deleted")
      .order("starts_at", { ascending: true })
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (data) {
      setHostedActivities(
        data.map((a) => ({
          ...a,
          host: profile,
        }))
      );
    }
  };

  /* -------------------- LOAD JOINED ACTIVITIES -------------------- */
  const loadJoinedActivities = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("activity_members")
      .select(`
        activity_id,
        activities:activities!activity_members_activity_fk (
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
      .limit(PROFILE_ACTIVITY_PAGE_SIZE);

    if (!data) return;

    const joined = data
    .map((member: any) => {
      const relation = member.activities;
      return Array.isArray(relation) ? relation[0] : relation;
    })
      .filter(
        (activity: any) =>
          activity &&
          activity.status !== "deleted" &&
          activity.host_id !== userId
      );

    setJoinedActivities(joined);
  };

  /* -------------------- INIT -------------------- */
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

  const getAge = (dob?: string) => {
    if (!dob) return "--";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <p className="p-6 text-sm text-gray-500">
        Loading profile…
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-white relative">
      {/* PROFILE HEADER */}
      <section className="flex flex-col items-center px-4 py-6">
        <div className="h-24 w-24 rounded-full bg-gray-300 overflow-hidden">
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          {profile?.name || "Your name"}, {getAge(profile?.dob)}
        </h2>

        {profile?.city && (
          <p className="mt-1 text-sm text-gray-500">
            📍 {profile.city}
          </p>
        )}

        <p className="mt-2 text-sm text-gray-600 text-center">
          {profile?.bio || "Tell people something about you"}
        </p>

        <button
          onClick={() => setIsEditOpen(true)}
          className="mt-3 text-sm font-semibold underline"
        >
          Edit profile
        </button>
      </section>

      {/* INTERESTS */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-2">Interests</h3>

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
      </section>

      {/* ACTIVITY TOGGLE */}
      <section className="px-4 mt-8">
        <div className="flex rounded-xl border overflow-hidden">
          <button
            onClick={() => setActivityTab("hosted")}
            className={`flex-1 py-3 text-sm font-semibold ${
              activityTab === "hosted"
                ? "bg-black text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Hosted ({hostedActivities.length})
          </button>

          <button
            onClick={() => setActivityTab("joined")}
            className={`flex-1 py-3 text-sm font-semibold ${
              activityTab === "joined"
                ? "bg-black text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Joined ({joinedActivities.length})
          </button>
        </div>
      </section>

      {/* ACTIVITIES LIST */}
      <section className="px-4 mt-6">
        {activityTab === "hosted" && (
          <>
            {hostedActivities.length === 0 ? (
              <div className="rounded-lg border p-3 text-sm text-gray-500">
                You haven’t created any activities yet.
              </div>
            ) : (
              <div className="space-y-4">
                {hostedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    subtitle="Hosted by you"
                    distance=""
                    time={new Date(activity.starts_at).toLocaleString()}
                    type={activity.type}
                    tags={
                      activity.activity_tag_relations?.map(
                        (rel: any) => rel.activity_tags
                      ) ?? []
                    }
                    host={profile}
                    hideHost
                    onClick={() =>
                      router.push(`/activity/${activity.id}`)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activityTab === "joined" && (
          <>
            {joinedActivities.length === 0 ? (
              <div className="rounded-lg border p-3 text-sm text-gray-500">
                You haven’t joined any activities yet.
              </div>
            ) : (
              <div className="space-y-4">
                {joinedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    title={activity.title}
                    subtitle="You joined this activity"
                    distance=""
                    time={new Date(activity.starts_at).toLocaleString()}
                    type={activity.type}
                    tags={
                      activity.activity_tag_relations?.map(
                        (rel: any) => rel.activity_tags
                      ) ?? []
                    }
                    onClick={() =>
                      router.push(`/activity/${activity.id}`)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>


      {/* CREATE ACTIVITY */}
      <button
        onClick={() => router.push("/create")}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-black text-white text-2xl flex items-center justify-center"
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