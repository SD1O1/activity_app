import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type JoinStatus = "none" | "pending" | "approved" | "rejected";

export function useJoinStatus(activityId: string, hostId: string) {
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("none");

  const computeJoinStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setJoinStatus("none");
      return;
    }

    if (user.id === hostId) {
      setJoinStatus("approved");
      return;
    }

    const { data } = await supabase
      .from("join_requests")
      .select("status")
      .eq("activity_id", activityId)
      .eq("requester_id", user.id)
      .limit(1);

    setJoinStatus(data?.[0]?.status ?? "none");
  };

  useEffect(() => {
    computeJoinStatus();
  }, [activityId]);

  return { joinStatus, computeJoinStatus };
}