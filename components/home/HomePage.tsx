"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import Footer from "@/components/layout/Footer";
import CategoriesRow from "@/components/home/CategoriesRow";
import HomeActions from "./HomeActions";
import TrySomethingNew from "./TrySomethingNew";
import SearchModal from "@/components/modals/SearchModal";
import AuthModal from "@/components/modals/AuthModal";
import Sidebar from "@/components/layout/Sidebar";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { useNotifications } from "@/components/notifications/NotificationContext";
import { normalizeActivityTags } from "@/types/activity";

type HomeActivity = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  location_name: string | null;
  member_count: number | null;
  max_members: number | null;
  host_id: string;
  activity_tag_relations: { activity_tags: { id: string; name: string } | { id: string; name: string }[] | null }[] | null;
  host?: { id: string; name: string | null } | null;
};

export default function HomePage() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [openSearch, setOpenSearch] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activities, setActivities] = useState<HomeActivity[]>([]);

  const { user, profileCompleted, loading } = useClientAuthProfile();

  useEffect(() => {
    const fetchActivities = async () => {
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("activities")
        .select(`
          id,
          title,
          type,
          starts_at,
          location_name,
          member_count,
          max_members,
          host_id,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(8);

      if (viewer) query = query.neq("host_id", viewer.id);

      const { data: activityRows, error } = await query;

      if (error || !activityRows) {
        console.error("HOME ACTIVITY FETCH ERROR:", error);
        setActivities([]);
        return;
      }

      const hostIds = Array.from(new Set(activityRows.map((a) => a.host_id)));
      const { data: hosts } = await supabase.from("profiles").select("id, name").in("id", hostIds);

      const hostMap = Object.fromEntries((hosts || []).map((h) => [h.id, h]));

      setActivities(
        (activityRows as HomeActivity[]).map((a) => ({
          ...a,
          host: hostMap[a.host_id] || null,
        }))
      );
    };

    void fetchActivities();
  }, []);

  const nearYou = useMemo(() => activities.slice(0, 3), [activities]);

  return (
    <main className="min-h-screen bg-neutral-100 pb-6">
      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="grid h-12 w-12 place-items-center rounded-full border border-neutral-200 bg-white text-2xl shadow-sm">
            ☰
          </button>

          <button
            onClick={() => {
              if (!user) {
                setOpenAuthModal(true);
                return;
              }
              router.push("/notifications");
            }}
            className="relative grid h-12 w-12 place-items-center rounded-full border border-amber-500 bg-white text-xl"
            aria-label="Notifications"
          >
            🏆
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <section className="mt-8">
          <h1 className="text-6xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-7xl">
            Find your next <span className="text-amber-500">adventure</span>
          </h1>

          <button
            onClick={() => setOpenSearch(true)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left text-2xl text-neutral-400 shadow-sm"
          >
            <span>🔎</span>
            <span>What do you want to do?</span>
          </button>
        </section>
      </section>

      <CategoriesRow />

      <section className="mt-8 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">Activities Near You</h2>
            <button onClick={() => router.push("/activities")} className="text-2xl font-medium text-amber-500">See All</button>
          </div>

          <div className="space-y-4">
            {nearYou.map((activity) => {
              const tags = normalizeActivityTags(activity.activity_tag_relations);
              const primaryTag = tags[0]?.name ?? (activity.type === "group" ? "Group" : "1-on-1");
              const timeLabel = new Date(activity.starts_at).toLocaleString(undefined, {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              });

              const joined = typeof activity.member_count === "number" ? activity.member_count : 0;

              return (
                <button
                  key={activity.id}
                  onClick={() => router.push(`/activity/${activity.id}`)}
                  className="w-full rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-3xl font-semibold text-neutral-900">{activity.title}</h3>
                      <p className="mt-1 text-xl text-neutral-500">{activity.location_name || "Location shared after joining"}</p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-500">{primaryTag}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xl">
                    <span className="text-amber-500">🕒 {timeLabel}</span>
                    <span className="text-neutral-500">👥 {joined} joined</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <HomeActions
        user={user}
        profileCompleted={profileCompleted}
        loading={loading}
        openAuthModal={() => setOpenAuthModal(true)}
        onOpenSearch={() => setOpenSearch(true)}
      />

      <TrySomethingNew />
      <Footer />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={Boolean(user)} />

      <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />

      <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </main>
  );
}
