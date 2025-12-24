"use client";

import { useRouter } from "next/navigation";
import NotificationItem from "./NotificationItem";

export default function NotificationsView() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button
          onClick={() => router.back()}
          className="text-xl"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Notifications</h1>
      </div>

      {/* Notification list */}
      <section className="divide-y">
        <NotificationItem
          id="1"
          message="Rahul requested to join your Coffee Walk"
          time="2h ago"
          onClick={() => console.log("Go to host review")}
        />

        <NotificationItem
          id="2"
          message="Your request was approved for Evening Walk"
          time="1h ago"
          onClick={() => console.log("Go to activity detail")}
        />

        <NotificationItem
          id="3"
          message="New message in Coffee & Conversation"
          time="10m ago"
          onClick={() => console.log("Open chat")}
        />
      </section>
    </main>
  );
}