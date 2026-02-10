import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type JoinStatus = "none" | "pending" | "approved" | "rejected";

export function useJoinStatus(activityId: string, hostId: string) {
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("none");

  const computeJoinStatus = useCallback(async () => {
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

    const { data: member } = await supabase
      .from("activity_members")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (member) {
      setJoinStatus("approved");
      return;
    }

    const { data: request } = await supabase
      .from("join_requests")
      .select("status")
      .eq("activity_id", activityId)
      .eq("requester_id", user.id)
      .maybeSingle();

    if (request?.status === "pending") {
      setJoinStatus("pending");
      return;
    }

    if (request?.status === "rejected") {
      setJoinStatus("rejected");
      return;
    }

    setJoinStatus("none");
  }, [activityId, hostId]);

  useEffect(() => {
    const task = setTimeout(() => {
      void computeJoinStatus();
    }, 0);

    return () => clearTimeout(task);
  }, [computeJoinStatus]);

  return { joinStatus, computeJoinStatus };
}
