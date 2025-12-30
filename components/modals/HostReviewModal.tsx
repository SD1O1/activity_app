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
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      // 1️⃣ Fetch activity questions
      const { data: activity } = await supabase
        .from("activities")
        .select("questions")
        .eq("id", activityId)
        .single();

      setQuestions(activity?.questions || []);

      // 2️⃣ Fetch pending join requests WITH answers
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
    // 1️⃣ Update join request status
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
  
    // 3️⃣ If approved → ensure conversation + participants
    if (status === "approved") {
      let conversationId: string | null = null;
  
      // 3a️⃣ Check if conversation already exists
      const { data: existingConversation, error: fetchError } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("activity_id", activityId)
          .maybeSingle();
  
      if (fetchError) {
        console.error("Fetch conversation error:", fetchError);
        return;
      }
  
      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // 3b️⃣ Create conversation
        const { data: createdConversation, error: createError } =
          await supabase
            .from("conversations")
            .insert({ activity_id: activityId })
            .select("id")
            .single();
  
        if (createError || !createdConversation) {
          console.error("Create conversation error:", createError);
          return;
        }
  
        conversationId = createdConversation.id;
      }
  
      // 3c️⃣ Add requester as participant
      await supabase.from("conversation_participants").insert({
        conversation_id: conversationId,
        user_id: requesterId,
      });
    }
  
    // 4️⃣ Remove from local list
    setRequests((prev) =>
      prev.filter((r) => r.requester_id !== requesterId)
    );
  
    // 5️⃣ Refresh parent state
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
            {/* QUESTIONS & ANSWERS */}
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

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => resolve(r.requester_id, "rejected")}
                className="flex-1 border rounded-xl py-2 text-sm"
              >
                Decline
              </button>
              <button
                onClick={() => resolve(r.requester_id, "approved")}
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