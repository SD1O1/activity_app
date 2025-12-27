"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationItem from "./NotificationItem";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleNotificationClick = async (notification: any) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true } : n
      )
    );
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id);

    router.push(`/activity/${notification.activity_id}`);
  };

  // 1️⃣ Initial fetch
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      setUserId(auth.user.id);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      setNotifications(data || []);
    };

    fetchNotifications();
  }, []);

  // 2️⃣ Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (notifications.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center px-6">
        <div>
          <p className="text-lg font-medium text-gray-900">
            No notifications yet
          </p>
          <p className="mt-2 text-sm text-gray-500">
            When someone interacts with your activities, you’ll see it here.
          </p>
        </div>
      </div>
    );
  }  

  return (
    <section className="divide-y">
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          message={n.message}
          actor_name={n.actor_name}
          actor_avatar={n.actor_avatar}
          time={formatTime(n.created_at)}
          is_read={n.is_read}
          onClick={() => handleNotificationClick(n)}
        />      
      ))}
    </section>
  );
}