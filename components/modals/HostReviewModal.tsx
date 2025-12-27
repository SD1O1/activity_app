"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  onResolved: () => Promise<void>;
};

export default function HostReviewModal({
  open,
  onClose,
  activityId,
  onResolved,
}: Props) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("*")
        .eq("activity_id", activityId)
        .eq("status", "pending");

      setRequests(data || []);
    };

    load();
  }, [open, activityId]);

  const resolve = async (requesterId: string, status: "approved" | "rejected") => {
    await supabase
      .from("join_requests")
      .update({ status })
      .eq("activity_id", activityId)
      .eq("requester_id", requesterId)
      .eq("status", "pending");

    await supabase.from("notifications").insert({
      user_id: requesterId,
      type: status,
      message:
        status === "approved"
          ? "Your request was approved"
          : "Your request was declined",
      activity_id: activityId,
    });

    setRequests((prev) =>
      prev.filter((r) => r.requester_id !== requesterId)
    );

    await onResolved();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-4">
        <h2 className="mb-4 font-semibold">Join Requests</h2>

        {requests.length === 0 && (
          <p className="text-sm text-gray-500">No pending requests</p>
        )}

        {requests.map((r) => (
          <div key={r.requester_id} className="mb-3 flex gap-2">
            <button
              onClick={() => resolve(r.requester_id, "rejected")}
              className="flex-1 border rounded-xl py-2"
            >
              Decline
            </button>
            <button
              onClick={() => resolve(r.requester_id, "approved")}
              className="flex-1 bg-black text-white rounded-xl py-2"
            >
              Approve
            </button>
          </div>
        ))}

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
