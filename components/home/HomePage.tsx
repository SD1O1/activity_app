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

      <section className="px-4 py-5 space-y-4">
        <h1 className="text-[20px] font-semibold text-[#111827]">Find your next adventure</h1>
        <button onClick={() => setOpenSearch(true)} className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-left text-[14px] text-[#98a0b0]">
          🔎 What do you want to do?
        </button>
      </section>

      <CategoriesRow />

      <section className="px-4 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#111827]">Activities Near You</h2>
          <button className="text-[14px] font-semibold text-[#f97316]">See All</button>
        </div>

        <div className="space-y-3">
          {activities.map((activity, idx) => {
            const tags = activity.activity_tag_relations?.flatMap((rel) => (Array.isArray(rel.activity_tags) ? rel.activity_tags : [rel.activity_tags])).filter((tag): tag is ActivityTag => Boolean(tag)).map((tag) => tag.name).filter(Boolean) ?? [];
            const backgrounds = ["from-[#d7d8dc] to-[#111827]", "from-[#7f4a1d] to-[#201e1f]", "from-[#0e2940] to-[#0b0f1d]"];

            return (
              <button key={activity.id} onClick={() => router.push(`/activity/${activity.id}`)} className={`w-full rounded-2xl bg-gradient-to-br p-4 text-left text-white shadow-sm ${backgrounds[idx % backgrounds.length]}`}>
                <div className="flex items-center justify-between text-[12px] opacity-90">
                  <span>{activity.host?.name || "Host"}</span>
                  <span>{activity.type === "group" ? "GROUP" : "1-ON-1"}</span>
                </div>
                <h3 className="mt-12 text-[24px] font-bold leading-tight">{activity.title}</h3>
                <p className="mt-2 text-[13px] opacity-90">🕒 {new Date(activity.starts_at).toLocaleString()}</p>
                <div className="mt-2 flex items-center justify-between text-[12px] opacity-90">
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
