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
    setResolving(true);

    const { error: rejectError } = await supabase
      .from("join_requests")
      .update({ status: "rejected" })
      .eq("id", joinRequestId);

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
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
      <div className="flex h-[90vh] w-full flex-col rounded-t-[2.25rem] bg-neutral-100">
        <div className="mx-auto mt-3 h-2 w-20 rounded-full bg-neutral-300" />

        <div className="mt-3 flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-5xl font-semibold tracking-tight text-slate-900">Review Request</h2>
          <button onClick={onClose} className="text-5xl text-neutral-500">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 pb-44">
          {error ? <p className="text-lg text-red-600">{error}</p> : null}

          {requests.length === 0 && <p className="text-lg text-neutral-500">No pending requests</p>}

          {requests.map((r) => {
            const answers = normalizeAnswers(r.answers);
            const age = r.profile?.dob
              ? Math.max(0, new Date().getFullYear() - new Date(r.profile.dob).getFullYear())
              : null;

            return (
              <article key={r.id} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-100 bg-neutral-200">
                    {r.profile?.avatar_url ? (
                      <Image src={r.profile.avatar_url} alt={r.profile?.name ?? "Requester"} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg text-neutral-500">👤</div>
                    )}
                  </div>

                  <div>
                    <p className="text-4xl font-semibold text-slate-900">
                      {r.profile?.name ?? "Requester"} {age ? <span className="font-normal text-neutral-500">{age}</span> : null}
                    </p>
                    <p className="mt-1 text-xl text-neutral-600">{r.profile?.username ? `@${r.profile.username}` : "Pending join request"}</p>
                  </div>
                </div>

                {questions.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-4xl font-semibold tracking-tight text-slate-900">Responses to your questions</h3>
                    {questions.map((q, i) => (
                      <div key={i} className="rounded-2xl border border-neutral-200 bg-neutral-100 p-4">
                        <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">Question {i + 1}</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">{q}</p>
                        <p className="mt-2 text-2xl leading-relaxed text-neutral-700">{answers[i]?.trim() || "—"}</p>
                      </div>
                    ))}
                  </section>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={resolving}
                    className="rounded-2xl bg-amber-500 py-3 text-2xl font-semibold text-white disabled:opacity-60"
                  >
                    Accept Request
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={resolving}
                    className="rounded-2xl border-2 border-amber-500 bg-white py-3 text-2xl font-semibold text-amber-600 disabled:opacity-60"
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
