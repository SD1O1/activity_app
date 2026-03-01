"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityCard from "@/components/cards/ActivityCard";
import ActivitiesMap from "../map/ActivitesMap";
import { ActivityListItem, normalizeActivityTags } from "@/types/activity";

type Props = { activities: ActivityListItem[]; loading: boolean };

export default function ActivitiesPageView({ activities, loading }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const mappedActivities = useMemo(() => activities.filter((activity) => activity.public_lat != null && activity.public_lng != null), [activities]);

  return (
    <main className="mobile-app-container pb-6 pt-4">
      <section>
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef3c7] text-lg">⭐</div>
            <div>
              <h1 className="text-[20px] md:text-[24px] font-semibold text-[#0f172a]">Activities</h1>
              <p className="text-[13px] text-[#64748b]">Find partners nearby</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowMap((prev) => !prev)} className="h-9 rounded-xl border border-black/10 bg-white px-3 text-[13px] font-semibold text-[#334155]">
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        </header>

        {showMap && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-black/5 bg-white">
            <ActivitiesMap activities={mappedActivities} activeId={activeId} onSelect={(id) => {
              setActiveId(id);
              document.getElementById(`activity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }} />
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="mt-8 text-center text-[14px] text-[#64748b]">Loading activities...</p>
          ) : activities.length === 0 ? (
            <p className="mt-8 text-center text-[14px] text-[#64748b]">No activities yet.</p>
          ) : (
            activities.map((activity) => {
              const tags = normalizeActivityTags(activity.activity_tag_relations);
              return (
                <div key={activity.id} id={`activity-${activity.id}`} onClick={() => setActiveId(activity.id)} className={`rounded-2xl transition ${activeId === activity.id ? "ring-2 ring-[#0f172a]/30" : ""}`}>
                  <ActivityCard
                    id={activity.id}
                    title={activity.title}
                    subtitle={activity.category ?? "Join this activity nearby."}
                    location={activity.location_name || "Location shared after joining"}
                    startsAt={activity.starts_at}
                    type={activity.type}
                    tags={tags}
                    host={activity.host ?? undefined}
                    memberCount={activity.member_count ?? null}
                    maxMembers={activity.max_members ?? null}
                    onClick={() => router.push(`/activity/${activity.id}`)}
                  />
                </div>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
