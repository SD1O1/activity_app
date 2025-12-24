"use client";

import Header from "@/components/layout/Header";
import ActivityCard from "@/components/cards/ActivityCard";
import CategoriesRow from "@/components/home/CategoriesRow";
import HomeActions from "./HomeActions";
import TrySomethingNew from "./TrySomethingNew";
import { useEffect, useState } from "react";
import SearchModal from "@/components/modals/SearchModal";
import Footer from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type HomePageProps = {
  user: User | null;
};


export default function HomePage({user}:HomePageProps) {

  const [openSearch, setOpenSearch] = useState(false);
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setActivities(data);
      });
  }, []);
  
  return (
    <main className="min-h-screen bg-white">
      <Header />

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

      <section className="px-4">
        <h2 className="mb-3 text-lg font-semibold">
          Activities Near You
        </h2>

        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <ActivityCard
              key={activity.id}
              title={activity.title}
              subtitle={activity.category}
              distance="Nearby"
              time={new Date(activity.date).toLocaleString()}
              type={activity.type}
              onClick={() => router.push(`/activity/${activity.id}`)}
            />
          ))}
        </div>
      </section>

      <SearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
       />
       
      <HomeActions onOpenSearch={() => setOpenSearch(true)} />

      <TrySomethingNew />
      <Footer/>

    </main>
  );
}