"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActivityCard from "@/components/cards/ActivityCard";
import ActivitiesMap from "../map/ActivitesMap";
import { ActivityListItem, normalizeActivityTags } from "@/types/activity";

type Props = {
  activities: ActivityListItem[];
  loading: boolean;
};

export default function ActivitiesPageView({ activities, loading }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const mappedActivities = useMemo(
    () => activities.filter((activity) => activity.public_lat != null && activity.public_lng != null),
    [activities]
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 pb-8 pt-6 md:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fef3c7] text-3xl">⭐</div>
            <div>
              <h1 className="text-5xl font-semibold text-[#0f172a]">Activities</h1>
              <p className="text-2xl text-[#64748b]">Find partners nearby</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMap((prev) => !prev)}
            className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#334155]"
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        </header>

        {showMap && (
          <div className="mb-5 overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white">
            <ActivitiesMap
              activities={mappedActivities}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                document.getElementById(`activity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          </div>
        )}

        <section className="space-y-5">
          {loading ? (
            <p className="mt-10 text-center text-xl text-[#64748b]">Loading activities...</p>
          ) : activities.length === 0 ? (
            <p className="mt-10 text-center text-xl text-[#64748b]">No activities yet.</p>
          ) : (
            activities.map((activity) => {
              const tags = normalizeActivityTags(activity.activity_tag_relations);

              return (
                <div
                  key={activity.id}
                  id={`activity-${activity.id}`}
                  onClick={() => setActiveId(activity.id)}
                  className={`rounded-[30px] transition ${activeId === activity.id ? "ring-2 ring-[#0f172a]" : ""}`}
                >
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