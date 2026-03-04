"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import Image from "next/image";

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
  if (Array.isArray(answers)) return answers.map((answer) => (typeof answer === "string" ? answer : ""));
  if (typeof answers === "string") return [answers];
  if (answers && typeof answers === "object") {
    return Object.values(answers).map((answer) => (typeof answer === "string" ? answer : ""));
  }
  return [];
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
      const { data: profiles } = await supabase.from("profiles").select("id, username, name, avatar_url, dob, verified").in("id", requesterIds);

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
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white sm:mx-auto sm:max-w-md">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Review Request</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100" aria-label="Close review modal">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {requests.length === 0 && <p className="text-sm text-gray-500">No pending requests</p>}

          {requests.map((r) => {
            const answers = normalizeAnswers(r.answers);
            const age = r.profile?.dob ? Math.max(0, new Date().getFullYear() - new Date(r.profile.dob).getFullYear()) : null;

            return (
              <article key={r.id} className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#ff6b00]/20 bg-neutral-200">
                    {r.profile?.avatar_url ? (
                      <Image src={r.profile.avatar_url} alt={r.profile?.name ?? "Requester"} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg text-neutral-500">👤</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">
                      {r.profile?.name ?? "Requester"} {age ? <span className="font-medium text-gray-500">{age}</span> : null}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {r.profile?.username ? `@${r.profile.username}` : "Sent a join request for your activity."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">Responses to your questions</h3>

                  {questions.length === 0 ? (
                    <p className="text-sm text-gray-500">This request has no required question responses.</p>
                  ) : (
                    questions.map((question, index) => (
                      <div key={index} className="rounded-2xl border border-gray-100 bg-white p-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#ff6b00]">Question {index + 1}</p>
                        <p className="mb-2 text-sm font-semibold text-gray-800">{question}</p>
                        <p className="text-sm leading-relaxed text-gray-600">{answers[index] || "No response provided."}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={resolving}
                    className="w-full rounded-2xl bg-[#ff6b00] py-3.5 font-bold text-white shadow-lg shadow-orange-500/20 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={resolving}
                    className="w-full rounded-2xl border-2 border-[#ff6b00] py-3.5 font-bold text-[#ff6b00] transition hover:bg-orange-50 active:scale-[0.98] disabled:opacity-60"
                  >
                    Decline Request
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
