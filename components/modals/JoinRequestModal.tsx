"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getBlockedUserIds } from "@/lib/blocking";

type JoinRequestModalProps = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  hostId: string;
  questions: string[];
  userId: string | null;
  onSuccess: () => Promise<void>;
};

type ActivitySummary = {
  title: string;
  starts_at: string;
  location_name: string;
};

export default function JoinRequestModal({
  open,
  onClose,
  activityId,
  hostId,
  questions,
  userId,
  onSuccess,
}: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [hostName, setHostName] = useState("Host");


  useEffect(() => {
    if (!open) return;

    const loadSummary = async () => {
      const { data: activity } = await supabase
        .from("activities")
        .select("title, starts_at, location_name")
        .eq("id", activityId)
        .single();

      if (activity) setSummary(activity);

      const { data: host } = await supabase.from("profiles").select("name").eq("id", hostId).single();
      if (host?.name) setHostName(host.name);
    };

    void loadSummary();
  }, [open, activityId, hostId]);

  if (!open) return null;

  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
        <div className="w-full rounded-t-[2rem] bg-neutral-100 p-5">
          <p className="text-lg text-red-600">You must be logged in</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      return;
    }

    if (questions.length > 0) {
      const hasEmpty = answers.some((a) => a.trim().length === 0);
      if (hasEmpty) {
        setError("Please answer all questions before submitting.");
        return;
      }
    }

    setLoading(true);

    const { blockedUserIds } = await getBlockedUserIds(supabase, user.id);

    if (blockedUserIds.includes(hostId)) {
      setError("You cannot request to join this activity.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/activities/request-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId,
        hostId,
        answers: questions.length > 0 ? answers : [],
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to send join request");
      setLoading(false);
      return;
    }

    setLoading(false);
    await onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40">
      <div className="flex h-[90vh] w-full flex-col rounded-t-[2.25rem] bg-neutral-100">
        <div className="mx-auto mt-3 h-2 w-20 rounded-full bg-neutral-300" />

        <div className="mt-3 flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-5xl font-semibold tracking-tight text-slate-900">Request to Join</h2>
          <button onClick={onClose} className="text-5xl text-neutral-500">✕</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 pb-44">
          <section className="rounded-3xl border border-amber-100 bg-amber-50/40 p-5">
            <h3 className="text-4xl font-semibold text-slate-900">{summary?.title ?? "Activity"}</h3>
            <p className="mt-2 text-2xl text-neutral-600">👤 Hosted by {hostName}</p>
            <p className="mt-1 text-2xl text-neutral-600">📅 {summary?.starts_at ? new Date(summary.starts_at).toLocaleString() : "Date TBD"}</p>
            <p className="mt-1 text-2xl text-neutral-600">📍 {summary?.location_name || "Location shared after approval"}</p>
          </section>

          <div className="flex items-center gap-3 text-neutral-500">
            <span className="text-2xl font-semibold uppercase tracking-wide">Host Questions</span>
            <span className="h-px flex-1 bg-neutral-300" />
          </div>

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index}>
                  <p className="mb-2 text-4xl font-semibold text-slate-900">{q}</p>
                  <textarea
                    value={answers[index] ?? ""}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[index] = e.target.value;
                      setAnswers(updated);
                    }}
                    placeholder="Type your answer..."
                    className="w-full rounded-2xl border border-neutral-300 bg-white p-4 text-2xl text-neutral-700"
                    rows={4}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-lg text-neutral-500">No host questions for this activity.</p>
          )}

          {error && <p className="text-lg text-red-600">{error}</p>}
        </div>

        <div className="border-t border-neutral-200 bg-neutral-100 px-6 py-5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 py-4 text-4xl font-semibold text-white shadow disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Request  ➤"}
          </button>
          <p className="mt-3 text-center text-lg text-neutral-500">
            The host will review your request and you&apos;ll be notified of their decision.
          </p>
        </div>
      </div>
    </div>
  );
}
