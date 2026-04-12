"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "./NotificationContext";
import { getBlockedUserIds } from "@/lib/blocking";

type FilterType = "all" | "join" | "approved" | "chat";

const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 50;

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString();
}

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  created_at: string;
  activity_id: string | null;
  actor_id: string | null;
  is_read: boolean;
};

type ActorProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type EnrichedNotification = NotificationRow & {
  actor: ActorProfile | null;
};

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearUnreadCount } = useNotifications();

  const page = Math.max(Number(searchParams.get("page") ?? "0") || 0, 0);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? String(DEFAULT_NOTIFICATIONS_PAGE_SIZE)) || DEFAULT_NOTIFICATIONS_PAGE_SIZE, 1),
    DEFAULT_NOTIFICATIONS_PAGE_SIZE
  );
  const rangeFrom = page * limit;
  const rangeTo = rangeFrom + limit - 1;

  useEffect(() => {
    const loadNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      clearUnreadCount();

      const { blockedUserIds } = await getBlockedUserIds(supabase, user.id);

      const { data: list, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          message,
          created_at,
          activity_id,
          actor_id,
          is_read
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(rangeFrom, rangeTo);

      if (error || !list) {
        setNotifications([]);
        return;
      }

      const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter(Boolean)));

      let actorMap: Record<string, ActorProfile> = {};
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", actorIds);

        actorMap = Object.fromEntries((actors || []).map((a) => [a.id, a as ActorProfile]));
      }

      const enriched: EnrichedNotification[] = (list as NotificationRow[])
        .filter((n) => !n.actor_id || !blockedUserIds.includes(n.actor_id))
        .map((n) => ({
          ...n,
          actor: n.actor_id ? actorMap[n.actor_id] : null,
        }));

      setNotifications(enriched);
    };

    void loadNotifications();
  }, [clearUnreadCount, limit, rangeFrom, rangeTo]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "join") return n.type === "join_request";
    if (activeFilter === "approved") return n.type === "approved";
    if (activeFilter === "chat") return n.type === "chat";
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[1.75rem] border border-orange-100/80 bg-white/95 shadow-[0_18px_40px_-32px_rgba(249,115,22,0.45)]">
        <div className="sticky top-0 z-10 rounded-t-[1.75rem] border-b border-orange-100/80 bg-white/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Notifications</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "join", label: "Join Requests" },
              { key: "approved", label: "Accepted" },
              { key: "chat", label: "Chats" },
            ].map((tab) => {
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as FilterType)}
                  className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
                    active
                      ? "border-orange-400 bg-[#f97316] text-white shadow-[0_10px_20px_-15px_rgba(249,115,22,0.9)]"
                      : "border-orange-200 bg-orange-50/70 text-slate-600 hover:border-orange-300 hover:bg-orange-100/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center px-6 text-center text-sm text-slate-500">
            No notifications in this category
          </div>
        ) : (
          <section className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
            {filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                actorName={n.actor?.name ?? undefined}
                actorAvatar={n.actor?.avatar_url}
                message={n.message}
                time={formatTime(n.created_at)}
                isRead={n.is_read}
                onClick={() => {
                  if (n.activity_id) {
                    router.push(`/activity/${n.activity_id}`);
                  }
                }}
              />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}