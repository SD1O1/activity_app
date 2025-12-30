"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "./NotificationContext";

type FilterType = "all" | "join" | "approved" | "chat";

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const router = useRouter();
  const { clearUnreadCount } = useNotifications();

  useEffect(() => {
    const loadNotifications = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      // mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      clearUnreadCount();

      const { data: list } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setNotifications(list || []);
    };

    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "join") return n.type === "join_request";
    if (activeFilter === "approved") return n.type === "approved";
    if (activeFilter === "chat") return n.type === "chat";
    return true;
  });

  return (
    <>
      {/* FILTER TABS */}
      <div className="sticky top-0 z-10 bg-white border-b">
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
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                activeFilter === tab.key
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredNotifications.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center text-sm text-gray-500">
          No notifications in this category
        </div>
      ) : (
        <section className="divide-y">
          {filteredNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              message={n.message}
              actor_name={n.actor_name}
              actor_avatar={n.actor_avatar}
              time={formatTime(n.created_at)}
              is_read={true}
              onClick={() => {
                if (n.activity_id) {
                  router.push(`/activity/${n.activity_id}`);
                }
              }}
            />
          ))}
        </section>
      )}
    </>
  );
}