"use client";

import { useRouter } from "next/navigation";
import ActivityCard from "@/components/cards/ActivityCard";

type ActivitiesPageViewProps = {
  activities: any[];
  loading: boolean;
};

export default function ActivitiesPageView({
  activities,
  loading,
}: ActivitiesPageViewProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button onClick={() => router.back()} className="text-xl">
          ←
        </button>
        <div>
          <h1 className="text-lg font-semibold">Activities</h1>
          <p className="text-xs text-gray-500">
            {activities.length} activities nearby
          </p>
        </div>
      </div>

      {/* Activity list */}
      <section className="px-4 py-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-center mt-10">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-center mt-10">No activities yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                title={activity.title}
                subtitle={activity.category}
                distance="Nearby"
                time={activity.starts_at
                  ? new Date(activity.starts_at).toLocaleString()
                  : "Time not set"}
                type={activity.type}
                onClick={() =>
                  router.push(`/activity/${activity.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}