"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActivitiesMap from "../map/ActivitesMap";
import { ActivityListItem, normalizeActivityTags } from "@/types/activity";

type Props = {
  activities: ActivityListItem[];
  loading: boolean;
  timeFilter?: string;
  distanceFilter?: number | null;
};

export default function ActivitiesPageView({ activities, loading, timeFilter = "anytime", distanceFilter }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [mapCollapsed, setMapCollapsed] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => setMapCollapsed(el.scrollTop > 28);

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const visibleMapActivities = useMemo(
    () => activities.filter((activity) => activity.public_lat != null && activity.public_lng != null),
    [activities]
  );

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="mx-auto w-full max-w-5xl px-4 pb-4 pt-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl">⭐</div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Activities</h1>
              <p className="text-xl text-neutral-500">Find partners nearby</p>
            </div>
          </div>
          <button
            onClick={() => setMapCollapsed((prev) => !prev)}
            className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl text-neutral-600 shadow-sm"
            aria-label="Toggle map"
            title="Toggle map"
          >
            ⚙
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 text-neutral-600 shadow-sm">Time: {timeFilter}</span>
          {distanceFilter ? <span className="rounded-full bg-white px-3 py-1 text-neutral-600 shadow-sm">Distance: {distanceFilter} km</span> : null}
          <span className="rounded-full bg-white px-3 py-1 text-neutral-600 shadow-sm">Results: {activities.length}</span>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className={`overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-300 ${mapCollapsed ? "h-0 opacity-0 mb-0" : "mb-4 h-[220px] opacity-100 sm:h-[280px]"}`}>
          {!mapCollapsed && (
            <ActivitiesMap
              activities={visibleMapActivities}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                document.getElementById(`activity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          )}
        </div>
      </div>

      <section ref={listRef} className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-8 sm:px-6">
        {loading ? (
          <p className="pt-10 text-center text-neutral-500">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p className="pt-10 text-center text-neutral-500">No activities found for your filters.</p>
        ) : (
          activities.map((activity) => {
            const tags = normalizeActivityTags(activity.activity_tag_relations);
            const joined = typeof activity.member_count === "number" && typeof activity.max_members === "number";
            const isFull = joined && activity.member_count >= activity.max_members;

            return (
              <article
                key={activity.id}
                id={`activity-${activity.id}`}
                className={`rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition ${activeId === activity.id ? "ring-2 ring-amber-400" : ""}`}
                onMouseEnter={() => setActiveId(activity.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-200">
                      {activity.host?.avatar_url ? (
                        <img src={activity.host.avatar_url} alt={activity.host?.name ?? "Host"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg text-neutral-500">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="text-3xl font-semibold text-neutral-900">{activity.host?.name ?? "Host"}</p>
                      <p className="text-lg text-neutral-500">{new Date(activity.starts_at).toLocaleString()}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-600">
                    {tags[0]?.name ?? (activity.type === "group" ? "Group" : "1-on-1")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                  <div>
                    <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">{activity.title}</h2>
                    <p className="mt-2 text-xl leading-relaxed text-neutral-600">
                      {activity.category ?? "Meet people nearby for this activity."}
                    </p>

                    <p className="mt-3 text-2xl text-neutral-500">📍 {activity.location_name}</p>
                    <p className={`mt-1 text-2xl ${isFull ? "text-amber-500" : "text-neutral-500"}`}>
                      👥 {joined ? `${activity.member_count}/${activity.max_members} joined` : "Spots available"}
                    </p>
                  </div>

                  <div className="h-36 w-full rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-50 p-3 text-right text-4xl sm:h-40">
                    {activity.type === "group" ? "🧑‍🤝‍🧑" : "☕"}
                  </div>
                </div>

                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center -space-x-2">
                      {[0, 1, 2].map((idx) => (
                        <span key={idx} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-neutral-200 text-xs text-neutral-500">👤</span>
                      ))}
                    </div>

                    <button
                      onClick={() => router.push(`/activity/${activity.id}`)}
                      className={`rounded-2xl px-8 py-2.5 text-2xl font-semibold ${isFull ? "bg-neutral-200 text-neutral-500" : "bg-amber-500 text-white"}`}
                    >
                      {isFull ? "Full" : "Join"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
