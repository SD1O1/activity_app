"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivitiesPageView from "@/components/activity/ActivitiesPageView";
import { useSearchParams } from "next/navigation";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag");

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      let activityIds: string[] | null = null;

      // ✅ STEP 1: get activity IDs for selected tag
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

        activityIds = data.map(
          (row: { activity_id: string }) => row.activity_id
        );

        // No matching activities
        if (activityIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }
      }

      // ✅ STEP 2: fetch activities WITH public coordinates
      let query = supabase
        .from("activities")
        .select(`
          id,
          title,
          category,
          type,
          starts_at,
          public_lat,
          public_lng,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `);

      if (activityIds) {
        query = query.in("id", activityIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error("ACTIVITY FETCH ERROR:", error);
        setActivities([]);
      } else {
        setActivities(data || []);
      }

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