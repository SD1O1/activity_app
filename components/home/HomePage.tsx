"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Header from "@/components/layout/Header";
import CategoriesRow from "@/components/home/CategoriesRow";
import HomeActions from "./HomeActions";
import TrySomethingNew from "./TrySomethingNew";
import Footer from "@/components/layout/Footer";
import SearchModal from "@/components/modals/SearchModal";
import AuthModal from "@/components/modals/AuthModal";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type ActivityTag = { id: string; name: string };
type ActivityTagRelation = { activity_tags: ActivityTag | ActivityTag[] | null };
type ActivityRow = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  host_id: string;
  activity_tag_relations?: ActivityTagRelation[];
  host?: { name?: string | null; avatar_url?: string | null; verified?: boolean | null } | null;
};

export default function HomePage() {
  const router = useRouter();
  const [openSearch, setOpenSearch] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const { user, profileCompleted, loading } = useClientAuthProfile();

  useEffect(() => {
    const fetchActivities = async () => {
      const { data: { user: viewer } } = await supabase.auth.getUser();
      let query = supabase
        .from("activities")
        .select(`
          id,title,type,starts_at,host_id,
          activity_tag_relations ( activity_tags ( id, name ) )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);

      if (viewer) query = query.neq("host_id", viewer.id);
      const { data: activityRows, error } = await query;
      if (error || !activityRows) return setActivities([]);

      const hostIds = Array.from(new Set(activityRows.map((a) => a.host_id)));
      const { data: hosts } = await supabase.from("profiles").select("id, name, avatar_url, verified").in("id", hostIds);
      const hostMap = Object.fromEntries((hosts || []).map((h) => [h.id, h]));
      setActivities(activityRows.map((a) => ({ ...a, host: hostMap[a.host_id] || null })));
    };

    fetchActivities();
  }, []);

  return (
    <main className="mobile-app-container pb-8">
      <Header centerSlot={<span />} />

      <section className="pt-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Find your next adventure</h1>
          <button onClick={() => setOpenSearch(true)} className="h-11 w-full rounded-lg border border-transparent bg-gray-100 px-4 text-left text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400">
            🔎 What do you want to do?
          </button>
        </div>
      </section>

      <CategoriesRow />

      <section className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Activities Near You</h2>
          <button className="text-[14px] font-medium text-orange-500 transition hover:underline">See All</button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const tags = activity.activity_tag_relations?.flatMap((rel) => (Array.isArray(rel.activity_tags) ? rel.activity_tags : [rel.activity_tags])).filter((tag): tag is ActivityTag => Boolean(tag)).map((tag) => tag.name).filter(Boolean) ?? [];
            return (
              <button key={activity.id} onClick={() => router.push(`/activity/${activity.id}`)} className="flex h-full min-h-[200px] w-full flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{activity.host?.name || "Host"}</span>
                  <span>{activity.type === "group" ? "GROUP" : "1-ON-1"}</span>
                </div>
                <h3 className="mt-10 text-base font-semibold leading-tight text-gray-900">{activity.title}</h3>
                <p className="mt-3 text-sm text-gray-500">🕒 {new Date(activity.starts_at).toLocaleString()}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <span>{tags.slice(0, 2).join(" • ") || "Meet nearby"}</span>
                  <span>{tags.length > 0 ? `${tags.length} TAGS` : "OPEN"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <HomeActions user={user} profileCompleted={profileCompleted} loading={loading} openAuthModal={() => setOpenAuthModal(true)} onOpenSearch={() => setOpenSearch(true)} />
      <TrySomethingNew />
      <Footer />
      <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />
      <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </main>
  );
}