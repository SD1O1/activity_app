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

    // Host is always approved
    if (user.id === hostId) {
      setJoinStatus("approved");
      return;
    }

    // 1️⃣ Check active membership FIRST (source of truth)
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

    // 2️⃣ Fall back to join_requests
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

    // 3️⃣ Otherwise: not joined
    setJoinStatus("none");
  };

  useEffect(() => {
    computeJoinStatus();
  }, [activityId]);

  return { joinStatus, computeJoinStatus };
}