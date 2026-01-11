"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityCard from "@/components/cards/ActivityCard";
import ActivitiesMap from "../map/ActivitesMap";

type Props = {
  activities: any[];
  loading: boolean;
};

export default function ActivitiesPageView({
  activities,
  loading,
}: Props) {
  const router = useRouter();

  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 🔹 shrink map when user scrolls list (mobile UX)
  const [mapCollapsed, setMapCollapsed] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      setMapCollapsed(el.scrollTop > 40);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* MAP */}
      <div
        className={`transition-all duration-300 ${
          mapCollapsed ? "h-[180px]" : "h-[280px]"
        }`}
      >
        <ActivitiesMap
          activities={activities}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            document
              .getElementById(`activity-${id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      </div>

      {/* LIST */}
      <section
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {loading ? (
          <p className="text-center mt-10">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="text-center mt-10">No activities yet.</p>
        ) : (
          activities.map((activity) => {
            const tags =
              activity.activity_tag_relations?.map(
                (rel: any) => rel.activity_tags
              ) ?? [];

            return (
              <div
                key={activity.id}
                id={`activity-${activity.id}`}
                onClick={() => setActiveId(activity.id)}
                className={`transition ${
                  activeId === activity.id ? "ring-2 ring-black rounded-xl" : ""
                }`}
              >
                <ActivityCard
                  title={activity.title}
                  subtitle={activity.category}
                  distance={
                    activity.distanceKm != null
                      ? `${activity.distanceKm.toFixed(1)} km away`
                      : "Nearby"
                  }
                  time={
                    activity.starts_at
                      ? new Date(activity.starts_at).toLocaleString()
                      : "Time not set"
                  }
                  type={activity.type}
                  tags={tags}
                  onClick={() =>
                    router.push(`/activity/${activity.id}`)
                  }
                />
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}