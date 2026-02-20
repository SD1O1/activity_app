"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import HostMiniProfile from "@/components/profile/HostMiniProfile";

/* =========================
   TYPES
========================= */

type RequesterProfile = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  dob: string | null;
  verified: boolean | null;
};

type JoinRequest = {
  id: string; // join_requests.id
  requester_id: string;
  answers: unknown;
  profile: RequesterProfile | null;
};

const normalizeAnswers = (answers: unknown): string[] => {
  if (Array.isArray(answers)) {
    return answers.map(answer =>
      typeof answer === "string" ? answer : ""
    );
  }

  if (typeof answers === "string") {
    return [answers];
  }

  if (answers && typeof answers === "object") {
    return Object.values(answers).map(answer =>
      typeof answer === "string" ? answer : ""
    );
  }

  return [];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onResolved: () => Promise<void>;
};

export default function HostReviewModal({
  open,
  onClose,
  onResolved,
}: Props) {
  const params = useParams();
  const activityId = params?.id as string | undefined;

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);

  /* =========================
     LOAD PENDING REQUESTS
  ========================= */

  useEffect(() => {
    if (!open || !activityId) return;

    const load = async () => {
      // 1️⃣ Load activity questions
      const { data: activity } = await supabase
        .from("activities")
        .select("questions")
        .eq("id", activityId)
        .single();

      setQuestions(activity?.questions || []);

      // 2️⃣ Load pending join requests
      const { data: joins } = await supabase
        .from("join_requests")
        .select("id, requester_id, answers")
        .eq("activity_id", activityId)
        .eq("status", "pending");

      if (!joins || joins.length === 0) {
        setRequests([]);
        return;
      }

      // 3️⃣ Load requester profiles (IMPORTANT: include username)
      const requesterIds = joins.map(j => j.requester_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url, dob, verified")
        .in("id", requesterIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      setRequests(
        joins.map(j => ({
          ...j,
          profile: profileMap.get(j.requester_id) || null,
        }))
      );
    };

    load();
  }, [open, activityId]);

  /* =========================
     APPROVE / REJECT
  ========================= */

  const handleApprove = async (joinRequestId: string) => {
    if (resolving) return;
    setResolving(true);

    const res = await fetch("/api/activities/approve-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinRequestId }),
    });

    if (!res.ok) {
      console.error("Approve failed");
      setResolving(false);
      return;
    }

    // Remove by join request ID
    setRequests(prev => prev.filter(r => r.id !== joinRequestId));

    setResolving(false);
    await onResolved();
  };

  const handleReject = async (joinRequestId: string) => {
    if (resolving || !activityId) return;
    setResolving(true);

    await supabase
      .from("join_requests")
      .update({ status: "rejected" })
      .eq("id", joinRequestId);

    // Remove by join request ID (IMPORTANT FIX)
    setRequests(prev => prev.filter(r => r.id !== joinRequestId));

    setResolving(false);
  };

  if (!open) return null;

  /* =========================
     UI
  ========================= */

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto">
        <h2 className="mb-4 font-semibold">Join Requests</h2>

        {requests.length === 0 && (
          <p className="text-sm text-gray-500">
            No pending requests
          </p>
        )}

        {requests.map(r => (
          <div
            key={r.id}
            className="mb-4 rounded-xl border p-3 space-y-3"
          >
            {r.profile && (
              <HostMiniProfile
                host={r.profile}
                clickable
                size="sm"
              />
            )}

            {questions.length > 0 && (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-gray-600">
                      {q}
                    </p>
                    <p className="text-sm">
                      {normalizeAnswers(r.answers)?.[i]?.trim() || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  handleReject(r.id)
                }
                disabled={resolving}
                className="flex-1 border rounded-xl py-2 text-sm"
              >
                Decline
              </button>

              <button
                onClick={() => handleApprove(r.id)}
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