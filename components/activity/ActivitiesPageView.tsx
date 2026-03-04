"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActivitiesMap from "../map/ActivitesMap";
import { ActivityListItem, normalizeActivityTags } from "@/types/activity";

type Props = {
  activities: ActivityListItem[];
  loading: boolean;
  timeFilter?: string;
  distanceFilter?: number | null;
};

function tagClass(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("well")) return "bg-blue-100 text-blue-700";
  if (t.includes("social")) return "bg-orange-100 text-orange-700";
  if (t.includes("entertain")) return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-600";
}

function coverForActivity(activity: ActivityListItem) {
  if (activity.type === "one-on-one") return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80";
  return "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80";
}

function relativeFromStart(startsAt: string) {
  const diffMs = Date.now() - new Date(startsAt).getTime();
  const mins = Math.max(1, Math.floor(Math.abs(diffMs) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivitiesPageView({ activities, loading, timeFilter = "anytime", distanceFilter }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const visibleMapActivities = useMemo(
    () => activities.filter((activity) => activity.public_lat != null && activity.public_lng != null),
    [activities]
  );

  return (
    <main className="min-h-screen bg-[#f3f3f4] pb-8">
      <section className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ee8c2b]/10 text-[#ee8c2b] text-xl">⭐</div>
            <div>
              <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-[2.1rem]">Walking</h1>
              <p className="text-xl text-slate-500 sm:text-sm font-medium">Find partners nearby</p>
            </div>
          </div>

          <button
            onClick={() => setShowMap((prev) => !prev)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-xl text-slate-600 shadow-sm"
            aria-label="Toggle filters map"
            title="Toggle map"
          >
            ⚙️
          </button>
        </header>

        <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Time: {timeFilter}</span>
          {distanceFilter ? <span className="rounded-full bg-white px-3 py-1 shadow-sm">Distance: {distanceFilter} km</span> : null}
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Results: {activities.length}</span>
        </div>

        {showMap && (
          <div className="mb-4 h-[220px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:h-[260px]">
            <ActivitiesMap
              activities={visibleMapActivities}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                document.getElementById(`activity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          </div>
        )}

        <section className="space-y-4">
          {loading ? (
            <p className="pt-10 text-center text-slate-500">Loading activities...</p>
          ) : activities.length === 0 ? (
            <p className="pt-10 text-center text-slate-500">No activities found for your filters.</p>
          ) : (
            activities.map((activity, index) => {
              const tags = normalizeActivityTags(activity.activity_tag_relations);
              const label = tags[0]?.name ?? (activity.type === "group" ? "Social" : "Wellness");
              const joined = typeof activity.member_count === "number" && typeof activity.max_members === "number";
              const isFull = joined && activity.member_count >= activity.max_members;

              return (
                <article
                  key={activity.id}
                  id={`activity-${activity.id}`}
                  className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition ${activeId === activity.id ? "ring-2 ring-[#ee8c2b]/50" : ""} ${isFull ? "opacity-85" : ""}`}
                  onMouseEnter={() => setActiveId(activity.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                        {activity.host?.avatar_url ? (
                          <img src={activity.host.avatar_url} alt={activity.host?.name ?? "Host"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm text-slate-500">👤</div>
                        )}
                      </div>
                      <div>
                        <p className="text-4xl font-semibold leading-none text-slate-900 sm:text-3xl">{activity.host?.name ?? "Host"}</p>
                        <p className="mt-1 text-2xl text-slate-500 sm:text-sm">{relativeFromStart(activity.starts_at)}</p>
                      </div>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-[1rem] font-semibold sm:text-xs ${tagClass(label)}`}>{label}</span>
                  </div>

                  <div className="mt-4 flex gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[2.5rem] font-bold leading-tight text-slate-900 sm:text-[2rem]">{activity.title}</h2>
                      <p className="mt-2 line-clamp-2 text-[1.9rem] leading-snug text-slate-600 sm:text-lg">
                        {activity.category ?? "Looking for people to join this activity. Come along if this sounds like your vibe!"}
                      </p>

                      <p className="mt-3 text-[1.9rem] text-slate-500 sm:text-base">📍 {activity.location_name || "Location shared after joining"}</p>
                      <p className={`mt-1 text-[1.9rem] sm:text-base ${isFull ? "text-[#ee8c2b]" : "text-slate-500"}`}>
                        👥 {joined ? `${activity.member_count}/${activity.max_members} joined${isFull ? " (Full)" : ""}` : "Spots available"}
                      </p>
                    </div>

                    <img src={coverForActivity(activity)} alt={activity.title} className={`h-32 w-32 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24 ${isFull ? "grayscale-[50%]" : ""}`} />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((idx) => (
                        <span key={idx} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-200 text-xs text-slate-500">
                          👤
                        </span>
                      ))}
                      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-500">
                        +{Math.max(1, (activity.member_count ?? 1) - 2)}
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/activity/${activity.id}`)}
                      className={`rounded-xl px-6 py-2 text-[1.9rem] font-bold sm:text-xl ${isFull ? "bg-slate-100 text-slate-400" : index === 0 ? "bg-[#ee8c2b]/10 text-[#ee8c2b]" : "bg-[#ee8c2b] text-white shadow-md shadow-orange-400/30"}`}
                    >
                      {isFull ? "Full" : "Join"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
