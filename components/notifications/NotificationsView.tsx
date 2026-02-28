"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams  } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "./NotificationContext";
import { getBlockedUserIds } from "@/lib/blocking";

type FilterType = "all" | "join" | "approved" | "chat";

const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 50;

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
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

      /* mark all as read */
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      clearUnreadCount();

      /* blocked users */
      const { blockedUserIds } = await getBlockedUserIds(
        supabase,
        user.id
      );

      /* fetch notifications (NO JOIN) */
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

      /* collect valid actor ids */
      const actorIds = Array.from(
        new Set(list.map((n) => n.actor_id).filter(Boolean))
      );

      /* fetch actor profiles safely */
      let actorMap: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", actorIds);

        actorMap = Object.fromEntries(
          (actors || []).map((a) => [a.id, a])
        );
      }

      /* enrich + block filter */
      const enriched = list
        .filter(
          (n) =>
            !n.actor_id ||
            !blockedUserIds.includes(n.actor_id)
        )
        .map((n) => ({
          ...n,
          actor: n.actor_id ? actorMap[n.actor_id] : null,
        }));

      setNotifications(enriched);
    };

    loadNotifications();
  }, [clearUnreadCount, limit, rangeFrom, rangeTo]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "join") return n.type === "join_request";
    if (activeFilter === "approved") return n.type === "approved";
    if (activeFilter === "chat") return n.type === "chat";
    return true;
  });

  return (
    <main className="mobile-app-container">
      {/* FILTER TABS */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/5">
        <div className="flex gap-2 px-4 py-2">
          {[
            { key: "all", label: "All" },
            { key: "join", label: "Join Requests" },
            { key: "approved", label: "Accepted" },
            { key: "chat", label: "Chats" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as FilterType)}
              className={`px-3 py-1.5 text-[14px] rounded-lg border-b-2 ${
                activeFilter === tab.key
                  ? "font-semibold text-[#111827] border-[#f59e5b]"
                  : "font-medium text-gray-500 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {filteredNotifications.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-gray-500">
          No notifications in this category
        </div>
      ) : (
        <section className="divide-y">
          {filteredNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              actorName={n.actor?.name}
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
    </main>
  );
}