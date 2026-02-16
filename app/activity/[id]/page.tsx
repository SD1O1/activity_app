"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivityDetail from "@/components/activity/ActivityDetail";
import { getBlockedUserIds } from "@/lib/blocking";
import { ActivityDetailItem } from "@/types/activity";

export default function Page() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [activity, setActivity] = useState<ActivityDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const {
          data: { user: viewer },
        } = await supabase.auth.getUser();

        const { data: activityData, error } = await supabase
          .from("activities")
          .select(`
          id,
          title,
          description,
          type,
          status,
          starts_at,
          location_name,
          cost_rule,
          exact_lat,
          exact_lng,
          public_lat,
          public_lng,
          host_id,
          questions,
          member_count,
          max_members,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
          .eq("id", id)
          .neq("status", "deleted")
          .single();

        if (error || !activityData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (viewer && viewer.id !== activityData.host_id) {
          const { blockedUserIds } = await getBlockedUserIds(supabase, viewer.id);

          if (blockedUserIds.includes(activityData.host_id)) {
            setNotFound(true);
            setLoading(false);
            return;
          }
        }

        const { data: host } = await supabase
          .from("profiles")
          .select("id, username, name, avatar_url, verified")
          .eq("id", activityData.host_id)
          .single();

        setActivity({
          ...activityData,
          host: host || null,
        });

        setLoading(false);
      } catch (err) {
        console.error("ACTIVITY DETAIL ERROR:", err);
        setNotFound(true);
        setLoading(false);
      }
    };

    void fetchActivity();
  }, [id]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (notFound || !activity) return <p className="p-6">Activity not found.</p>;

  return <ActivityDetail activity={activity} />;
}
