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

import Map from "@/components/map/Map";

export default function HomePage() {
  const router = useRouter();

  const [openSearch, setOpenSearch] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  const { user, profileCompleted, loading } =
    useClientAuthProfile();

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setActivities(data);
      }
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
                time={
                  activity.starts_at
                    ? new Date(
                        activity.starts_at
                      ).toLocaleString()
                    : "Time not set"
                }
                type={activity.type}
                tags={tags}
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