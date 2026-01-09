"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  hostId: string; // REQUIRED
  onResolved: () => Promise<void>;
};

export default function HostReviewModal({
  open,
  onClose,
  activityId,
  hostId,
  onResolved,
}: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      // Fetch activity questions
      const { data: activity } = await supabase
        .from("activities")
        .select("questions")
        .eq("id", activityId)
        .single();

      setQuestions(activity?.questions || []);

      // Fetch pending join requests
      const { data: joins } = await supabase
        .from("join_requests")
        .select("requester_id, answers")
        .eq("activity_id", activityId)
        .eq("status", "pending");

      setRequests(joins || []);
    };

    load();
  }, [open, activityId]);

  const resolve = async (
    requesterId: string,
    status: "approved" | "rejected"
  ) => {
    if (resolving || !hostId) return;

    setResolving(true);

    // 1️⃣ Update join request
    await supabase
      .from("join_requests")
      .update({ status })
      .eq("activity_id", activityId)
      .eq("requester_id", requesterId)
      .eq("status", "pending");

    // 2️⃣ Notify requester
    await supabase.from("notifications").insert({
      user_id: requesterId,
      type: status,
      message:
        status === "approved"
          ? "Your request was approved"
          : "Your request was declined",
      activity_id: activityId,
    });

    // ⛔ Stop here if rejected
    if (status === "rejected") {
      setRequests((prev) =>
        prev.filter((r) => r.requester_id !== requesterId)
      );
      setResolving(false);
      await onResolved();
      return;
    }

    // 3️⃣ Check for existing conversation
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("activity_id", activityId)
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // 4️⃣ Create conversation
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({ activity_id: activityId })
        .select("id")
        .single();

      if (error || !newConversation) {
        console.error("Failed to create conversation", error);
        setResolving(false);
        return;
      }

      conversationId = newConversation.id;

      // 5️⃣ Add HOST as participant
      await supabase.from("conversation_participants").insert({
        conversation_id: conversationId,
        user_id: hostId,
      });
    }

    // 6️⃣ Add REQUESTER as participant
    await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: requesterId,
    });

    // 7️⃣ Update UI
    setRequests((prev) =>
      prev.filter((r) => r.requester_id !== requesterId)
    );

    setResolving(false);
    await onResolved();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
        <h2 className="mb-4 font-semibold">Join Requests</h2>

        {requests.length === 0 && (
          <p className="text-sm text-gray-500">No pending requests</p>
        )}

        {requests.map((r) => (
          <div
            key={r.requester_id}
            className="mb-4 rounded-xl border p-3 space-y-3"
          >
            {/* Questions & Answers */}
            {questions.length > 0 && (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-600">
                      {q}
                    </p>
                    <p className="text-sm text-gray-900">
                      {r.answers?.[i] || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  resolve(r.requester_id, "rejected")
                }
                disabled={resolving}
                className="flex-1 border rounded-xl py-2 text-sm"
              >
                Decline
              </button>
              <button
                onClick={() =>
                  resolve(r.requester_id, "approved")
                }
                disabled={resolving}
                className="flex-1 bg-black text-white rounded-xl py-2 text-sm"
              >
                Approve
              </button>
            </div>
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