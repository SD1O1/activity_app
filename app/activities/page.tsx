"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ActivitiesPageView from "@/components/activity/ActivitiesPageView";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setActivities(data || []);
      }

      setLoading(false);
    };

    fetchActivities();
  }, []);

  return (
    <ActivitiesPageView
      activities={activities}
      loading={loading}
    />
  );
}