"use client";

import { useRouter } from "next/navigation";
import ActivityCard from "@/components/cards/ActivityCard";

export default function ActivitiesPage() {
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
        <div>
          <h1 className="text-lg font-semibold">Evening Walk</h1>
          <p className="text-xs text-gray-500">8 activities nearby</p>
        </div>
      </div>

      {/* Activity list */}
      <section className="px-4 py-4 flex flex-col gap-4">
        <ActivityCard
          title="Coffee & Walk by the Lake"
          subtitle="Rahul"
          time="Today, 6:00 PM"
          distance="0.4 km"
          type="group"
          onClick={() => router.push("/activity")}
        />

        <ActivityCard
          title="Quiet Evening Walk"
          subtitle="Ankit"
          time="Today, 7:30 PM"
          distance="0.9 km"
          type="group"
          onClick={() => router.push("/activity")}
        />

        <ActivityCard
          title="Sunset Walk + Conversation"
          subtitle="Neha"
          time="Tomorrow, 6:15 PM"
          distance="1.2 km"
          type="group"
          onClick={() => router.push("/activity")}
        />
      </section>
    </main>
  );
}
