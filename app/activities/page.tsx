"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivitiesPageView from "@/components/activity/ActivitiesPageView";
import { useSearchParams } from "next/navigation";
import { getBlockedUserIds } from "@/lib/blocking";
import { cityToLatLng, getBoundingBox } from "@/lib/geo";
import { ActivityListItem } from "@/types/activity";

const ACTIVITIES_PAGE_SIZE = 50;

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const tagId = searchParams.get("tag");
  const time = searchParams.get("time") ?? "anytime";
  const distance = Number(searchParams.get("distance")) || null;

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      // viewer (may be null)
      const {
        data: { user: viewer },
      } = await supabase.auth.getUser();

      // blocked users
      const { blockedUserIds } = viewer
        ? await getBlockedUserIds(supabase, viewer.id)
        : { blockedUserIds: [] };

      /* ───────────────── TAG FILTER ───────────────── */
      let activityIds: string[] | null = null;

      if (tagId) {
        const { data } = await supabase
          .from("activity_tag_relations")
          .select("activity_id")
          .eq("tag_id", tagId);

        activityIds = data?.map((r) => r.activity_id) ?? [];

        if (activityIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }
      }

      /* ───────────────── BASE QUERY ───────────────── */
      let query = supabase
        .from("activities")
        .select(`
          id,
          title,
          type,
          starts_at,
          location_name,
          public_lat,
          public_lng,
          host_id,
          member_count,
          max_members,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .eq("status", "open")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(ACTIVITIES_PAGE_SIZE);

      if (activityIds) query = query.in("id", activityIds);
      if (viewer) query = query.neq("host_id", viewer.id);

      if (blockedUserIds.length > 0) {
        query = query.not(
          "host_id",
          "in",
          `(${blockedUserIds.join(",")})`
        );
      }

      /* ───────────────── TIME FILTER ───────────────── */
      if (time !== "anytime") {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        if (time === "today") {
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
        }

        if (time === "tomorrow") {
          const t = new Date();
          t.setDate(t.getDate() + 1);
          start = new Date(t.setHours(0, 0, 0, 0));
          end = new Date(t.setHours(23, 59, 59, 999));
        }

        if (time === "weekend") {
          const d = new Date();
          const day = d.getDay();
          const saturday = new Date(d);
          saturday.setDate(d.getDate() + ((6 - day + 7) % 7));
          const sunday = new Date(saturday);
          sunday.setDate(saturday.getDate() + 1);

          start = new Date(saturday.setHours(0, 0, 0, 0));
          end = new Date(sunday.setHours(23, 59, 59, 999));
        }

        if (start && end) {
          query = query
            .gte("starts_at", start.toISOString())
            .lte("starts_at", end.toISOString());
        }
      }

      /* ───────────────── DISTANCE FILTER ───────────────── */
      if (distance && viewer) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("id", viewer.id)
          .single();

        if (profile?.city) {
          const coords = await cityToLatLng(profile.city);

          if (coords) {
            const box = getBoundingBox(
              coords.lat,
              coords.lng,
              distance
            );

            query = query
              .gte("public_lat", box.minLat)
              .lte("public_lat", box.maxLat)
              .gte("public_lng", box.minLng)
              .lte("public_lng", box.maxLng);
          }
        }
      }

      /* ───────────────── FETCH ───────────────── */
      const { data: activityRows } = await query;
      if (!activityRows) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const hostIds = Array.from(
        new Set(activityRows.map((a) => a.host_id))
      );

      const { data: hosts } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url, dob, verified")
        .in("id", hostIds);

      const hostMap = Object.fromEntries(
        (hosts || []).map((h) => [h.id, h])
      );

      setActivities(
        activityRows.map((a) => ({
          ...a,
          host: hostMap[a.host_id] || null,
        }))
      );

      setLoading(false);
    };

    void fetchActivities();
  }, [tagId, time, distance]);

  return (
    <ActivitiesPageView
      activities={activities}
      loading={loading}
    />
  );
}