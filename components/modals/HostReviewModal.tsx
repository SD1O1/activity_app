"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

type RequesterProfile = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  dob: string | null;
  verified: boolean | null;
};

type JoinRequest = {
  id: string;
  requester_id: string;
  answers: unknown;
  profile: RequesterProfile | null;
};

const normalizeAnswers = (answers: unknown): string[] => {
  if (Array.isArray(answers)) {
    return answers.map((answer) => (typeof answer === "string" ? answer : ""));
  }

  if (typeof answers === "string") {
    return [answers];
  }

  if (answers && typeof answers === "object") {
    return Object.values(answers).map((answer) => (typeof answer === "string" ? answer : ""));
  }

  return [];
};

const calculateAge = (dob?: string | null) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onResolved: () => Promise<void>;
};

export default function HostReviewModal({ open, onClose, onResolved }: Props) {
  const params = useParams();
  const activityId = params?.id as string | undefined;

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open || !activityId) return;

    const load = async () => {
      const { data: activity } = await supabase.from("activities").select("questions").eq("id", activityId).single();
      setQuestions(activity?.questions || []);

      const { data: joins } = await supabase
        .from("join_requests")
        .select("id, requester_id, answers")
        .eq("activity_id", activityId)
        .eq("status", "pending");

      if (!joins || joins.length === 0) {
        setRequests([]);
        return;
      }

      const requesterIds = joins.map((j) => j.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url, dob, verified")
        .in("id", requesterIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setRequests(
        joins.map((j) => ({
          ...j,
          profile: profileMap.get(j.requester_id) || null,
        }))
      );
    };

    void load();
  }, [open, activityId]);

  const handleApprove = async (joinRequestId: string) => {
    if (resolving) return;
    setError(null);
    setResolving(true);

    try {
      const res = await fetch("/api/activities/approve-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinRequestId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as { error?: string }));
        setError(payload.error || "Failed to approve join request");
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== joinRequestId));
      await onResolved();
      showToast("Join request approved", "success");
    } finally {
      setResolving(false);
    }
  };

  const handleReject = async (joinRequestId: string) => {
    if (resolving || !activityId) return;
    setError(null);
    const confirmed = confirm("Decline this join request?");
    if (!confirmed) return;

    setResolving(true);
    const { error: rejectError } = await supabase.from("join_requests").update({ status: "rejected" }).eq("id", joinRequestId);

    if (rejectError) {
      setError(rejectError.message || "Failed to decline join request");
      setResolving(false);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== joinRequestId));
    showToast("Join request declined", "info");
    setResolving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4">
      <div className="h-[90vh] w-full overflow-hidden rounded-t-[26px] bg-[#f3f3f3] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[26px]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#d8d8d8] px-6 py-7">
            <h2 className="text-[42px] font-medium leading-none text-[#1f1f23] md:text-[34px]">Review Request</h2>
            <button onClick={onClose} className="text-4xl leading-none text-[#5a5a5a]" aria-label="Close">
              ×
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {error ? <p className="text-[18px] text-red-600">{error}</p> : null}

            {requests.length === 0 ? <p className="text-[20px] text-[#6b6b70]">No pending requests.</p> : null}

            {requests.map((r) => {
              const answers = normalizeAnswers(r.answers);
              const age = calculateAge(r.profile?.dob);
              const displayName = r.profile?.name || r.profile?.username || "Requester";
              const bioFallback = "This user has not added a profile bio yet.";

              return (
                <div key={r.id} className="overflow-hidden rounded-3xl border border-[#dfdfdf] bg-[#f3f3f3]">
                  <div className="flex gap-4 border-b border-[#dddddd] px-4 py-5">
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dbdbdb] text-2xl text-[#5d5d62]">
                        {(displayName[0] || "?").toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="text-[18px] text-[#1f1f23] sm:text-[20px]">
                        <span className="font-medium">{displayName}</span>
                        {age !== null ? <span className="ml-2 text-[#737377]">{age}</span> : null}
                      </p>
                      <p className="mt-2 max-w-[36rem] text-[17px] leading-[1.35] text-[#5a5a5f]">{bioFallback}</p>
                    </div>
                  </div>

                  <div className="space-y-4 border-b border-[#dddddd] px-4 py-5">
                    <h3 className="text-[24px] font-medium text-[#1f1f23]">Responses to your questions</h3>
                    {(questions.length > 0 ? questions : ["Response"]).map((q, i) => (
                      <div key={q + i} className="rounded-2xl bg-[#ececec] p-4">
                        <p className="text-[18px] text-[#45454a]">{q}</p>
                        <p className="mt-2 text-[18px] leading-[1.4] text-[#5a5a5f]">{answers[i]?.trim() || "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 px-4 py-5">
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={resolving}
                      className="w-full rounded-2xl bg-[#101015] py-4 text-[20px] font-medium text-white disabled:opacity-60"
                    >
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={resolving}
                      className="w-full rounded-2xl border border-[#c8c8c8] bg-transparent py-4 text-[20px] font-medium text-[#4a4a4e] disabled:opacity-60"
                    >
                      Decline Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}