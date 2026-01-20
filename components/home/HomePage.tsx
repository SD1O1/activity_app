"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ActivityCard from "@/components/cards/ActivityCard";
import CategoriesRow from "@/components/home/CategoriesRow";
import HomeActions from "./HomeActions";
import TrySomethingNew from "./TrySomethingNew";
import SearchModal from "@/components/modals/SearchModal";
import AuthModal from "@/components/modals/AuthModal";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

export default function HomePage() {
  const router = useRouter();

  const [openSearch, setOpenSearch] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  const { user, profileCompleted, loading } =
    useClientAuthProfile();

  useEffect(() => {
    const fetchActivities = async () => {
      // 1️⃣ Fetch activities
      const { data: activityRows, error } = await supabase
        .from("activities")
        .select(`
          id,
          title,
          category,
          type,
          starts_at,
          public_lat,
          public_lng,
          host_id,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !activityRows) {
        console.error("HOME ACTIVITY FETCH ERROR:", error);
        setActivities([]);
        return;
      }

      // 2️⃣ Collect host IDs
      const hostIds = Array.from(
        new Set(activityRows.map((a) => a.host_id))
      );

      // 3️⃣ Fetch host profiles
      const { data: hosts } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, dob, verified")
        .in("id", hostIds);

      const hostMap = Object.fromEntries(
        (hosts || []).map((h) => [h.id, h])
      );

      // 4️⃣ Attach host to each activity
      const enrichedActivities = activityRows.map((a) => ({
        ...a,
        host: hostMap[a.host_id] || null,
      }));

      setActivities(enrichedActivities);
    };

    fetchActivities();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Search */}
      <section className="px-4 py-6">
        <h1 className="text-2xl font-bold">
          Find your next adventure
        </h1>

        <div
          onClick={() => setOpenSearch(true)}
          className="mt-4 rounded-xl border px-4 py-3 text-gray-400 cursor-pointer"
        >
          What do you want to do?
        </div>
      </section>

      <CategoriesRow />

      {/* Activities */}
      <section className="px-4">
        <h2 className="mb-3 text-lg font-semibold">
          Activities Near You
        </h2>

        <div className="space-y-4">
          {activities.map((activity) => {
            const tags =
              activity.activity_tag_relations?.map(
                (rel: any) => rel.activity_tags
              ) ?? [];

            return (
              <ActivityCard
                key={activity.id}
                title={activity.title}
                subtitle={activity.category}
                distance="Nearby"
                time={new Date(activity.starts_at).toLocaleString()}
                type={activity.type}
                tags={tags}
                host={activity.host}   // ✅ CONSISTENT
                onClick={() =>
                  router.push(`/activity/${activity.id}`)
                }
              />
            );
          })}
        </div>
      </section>

      <SearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
      />

      <HomeActions
        user={user}
        profileCompleted={profileCompleted}
        loading={loading}
        openAuthModal={() => setOpenAuthModal(true)}
        onOpenSearch={() => setOpenSearch(true)}
      />

      <TrySomethingNew />
      <Footer />

      <AuthModal
        open={openAuthModal}
        onClose={() => setOpenAuthModal(false)}
      />
    </main>
  );
}