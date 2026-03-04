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

type HomeActivity = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  location_name: string | null;
  member_count: number | null;
  max_members: number | null;
  host_id: string;
};

function pseudoDistance(activityId: string) {
  let hash = 0;
  for (let i = 0; i < activityId.length; i++) {
    hash = (hash * 31 + activityId.charCodeAt(i)) % 1000;
  }
  return (0.5 + (hash / 1000) * 2.5).toFixed(1);
}

export default function HomePage() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [openSearch, setOpenSearch] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activities, setActivities] = useState<HomeActivity[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { user, profileCompleted, loading } = useClientAuthProfile();

  useEffect(() => {
    const fetchActivities = async () => {
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("activities")
        .select(
          `
          id,
          title,
          type,
          starts_at,
          location_name,
          member_count,
          max_members,
          host_id
        `
        )
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

      setActivities(activityRows as HomeActivity[]);
    };

    void fetchActivities();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
      setAvatarUrl((data?.avatar_url as string | null) ?? null);
    };

    void fetchProfile();
  }, [user?.id]);

  const nearYou = useMemo(() => activities.slice(0, 3), [activities]);

  return (
    <main className="min-h-screen bg-[#f5f5f6] pb-32">
      <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm"
          >
            ☰
          </button>

          <button
            onClick={() => {
              if (!user) {
                setOpenAuthModal(true);
                return;
              }
              router.push("/profile");
            }}
            className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-[#f97316] bg-white text-sm text-slate-700"
            aria-label="Open profile"
          >
            {user && avatarUrl ? <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" /> : "👤"}
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />}
          </button>
        </div>

        <section className="mt-8">
          <h1 className="text-[3.2rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
            Find your next <br />
            <span className="text-[#f97316]">adventure</span>
          </h1>

          <button
            onClick={() => setOpenSearch(true)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-xl text-slate-400 shadow-sm"
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
            <h2 className="text-[2.1rem] font-bold tracking-tight text-slate-900 sm:text-3xl">Activities Near You</h2>
            <button onClick={() => router.push("/activities")} className="text-xl font-semibold text-[#f97316]">
              See All
            </button>
          </div>

          <div className="space-y-4">
            {nearYou.map((activity) => {
              const timeLabel = new Date(activity.starts_at).toLocaleString(undefined, {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              });

              const joined = typeof activity.member_count === "number" ? activity.member_count : 0;
              const distanceKm = pseudoDistance(activity.id);

              return (
                <button
                  key={activity.id}
                  onClick={() => router.push(`/activity/${activity.id}`)}
                  className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[1.95rem] font-bold text-slate-900 sm:text-2xl">{activity.title}</h3>
                      <p className="mt-1 text-xl text-slate-500 sm:text-base">{activity.location_name || "Location shared after joining"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-400">{distanceKm} km</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xl sm:text-base">
                    <span className="text-[#f97316]">🕒 {timeLabel}</span>
                    <span className="text-slate-500">👥 {joined} joined</span>
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-[#f97316]">
            <span className="text-xl">🧭</span>
            <span className="text-xs font-bold">Discover</span>
          </button>
          <button onClick={() => router.push("/activities")} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="text-xl">📅</span>
            <span className="text-xs font-medium">My Plans</span>
          </button>
          <button onClick={() => router.push("/notifications")} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="text-xl">💬</span>
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button onClick={() => router.push("/profile")} className="flex flex-col items-center gap-1 text-slate-400">
            <span className="text-xl">👤</span>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={Boolean(user)} />
      <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />
      <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </main>
  );
}
