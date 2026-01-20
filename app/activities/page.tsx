"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivitiesPageView from "@/components/activity/ActivitiesPageView";
import { useSearchParams } from "next/navigation";
import { getBlockedUserIds } from "@/lib/blocking";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      // 🔹 viewer (may be null)
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      // 🔹 blocked users
      const { blockedUserIds } = viewer
        ? await getBlockedUserIds(supabase, viewer.id)
        : { blockedUserIds: [] };

      let activityIds: string[] | null = null;

      // 🔹 TAG FILTER
      if (tagId) {
        const { data, error } = await supabase
          .from("activity_tag_relations")
          .select("activity_id")
          .eq("tag_id", tagId);

        if (error) {
          console.error("TAG RELATION ERROR:", error);
          setActivities([]);
          setLoading(false);
          return;
        }

        activityIds = data.map((r) => r.activity_id);

        if (activityIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }
      }

      // 🔹 FETCH ACTIVITIES (NO RELATION JOIN)
      let query = supabase
        .from("activities")
        .select(`
          id,
          title,
          category,
          type,
          starts_at,
          location_name,
          public_lat,
          public_lng,
          host_id,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .order("starts_at", { ascending: true });

      if (activityIds) {
        query = query.in("id", activityIds);
      }

      if (blockedUserIds.length > 0) {
        query = query.not(
          "host_id",
          "in",
          `(${blockedUserIds.join(",")})`
        );
      }

      const { data: activityRows, error } = await query;

      if (error || !activityRows) {
        console.error("ACTIVITY FETCH ERROR:", error);
        setActivities([]);
        setLoading(false);
        return;
      }

      // 🔹 FETCH HOST PROFILES (SAFE, ONE QUERY)
      const hostIds = Array.from(
        new Set(activityRows.map((a) => a.host_id))
      );

      const { data: hosts } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, dob, verified")
        .in("id", hostIds);

      const hostMap = Object.fromEntries(
        (hosts || []).map((h) => [h.id, h])
      );

      // 🔹 ATTACH HOST TO EACH ACTIVITY
      const enrichedActivities = activityRows.map((a) => ({
        ...a,
        host: hostMap[a.host_id] || null,
      }));

      setActivities(enrichedActivities);
      setLoading(false);
    };

    fetchActivities();
  }, [tagId]);

  return (
    <ActivitiesPageView
      activities={activities}
      loading={loading}
    />
  );
}