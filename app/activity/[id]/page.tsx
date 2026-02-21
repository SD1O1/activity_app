"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

  const fetchActivity = useCallback(async (showLoader = true) => {
    if (!id) return;

    if (showLoader) {
      setLoading(true);
    }
    setNotFound(false);

    try {
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      if (viewer) {
        await fetch("/api/activities/auto-complete-stale", { method: "POST" });
        await fetch(`/api/activities/${id}/auto-complete`, { method: "POST" });
      }
      
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

      if (activityData.status === "completed") {
        if (!viewer) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (viewer.id !== activityData.host_id) {
          const { data: membership } = await supabase
            .from("activity_members")
            .select("id")
            .eq("activity_id", id)
            .eq("user_id", viewer.id)
            .eq("status", "active")
            .maybeSingle();

          if (!membership) {
            setNotFound(true);
            setLoading(false);
            return;
          }
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
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const task = Promise.resolve().then(() => fetchActivity());
    void task;
  }, [id, fetchActivity]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`activity:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "activities",
          filter: `id=eq.${id}`,
        },
        () => {
          void fetchActivity(false);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, fetchActivity]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (notFound || !activity) return <p className="p-6">Activity not found.</p>;

  return <ActivityDetail activity={activity} />;
}