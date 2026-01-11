"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivityDetail from "@/components/activity/ActivityDetail";

export default function Page() {
  const { id } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      const { data } = await supabase
        .from("activities")
        .select(`
          *,
          activity_tag_relations (
            activity_tags (
              id,
              name
            )
          )
        `)
        .eq("id", id)
        .single();

      if (!data) {
        setNotFound(true);
      } else {
        setActivity(data);
      }

      setLoading(false);
    };

    fetchActivity();
  }, [id]);

  if (loading) return <p className="p-6">Loading…</p>;
  if (notFound) return <p className="p-6">Activity not found.</p>;

  return <ActivityDetail activity={activity} />;
}