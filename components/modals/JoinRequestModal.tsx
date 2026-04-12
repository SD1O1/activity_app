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

export default function JoinRequestModal({ open, onClose, activityId, hostId, questions, userId, onSuccess }: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [hostName, setHostName] = useState("Host");

  useEffect(() => {
    if (!open) return;

    const loadSummary = async () => {
      const { data: activity } = await supabase.from("activities").select("title, starts_at, location_name").eq("id", activityId).single();
      if (activity) setSummary(activity);

      const { data: host } = await supabase.from("profiles").select("name").eq("id", hostId).single();
      if (host?.name) setHostName(host.name);
    };

    void loadSummary();
  }, [open, activityId, hostId]);

  if (!open) return null;

  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/40">
        <div className="w-full rounded-t-[2rem] bg-white p-5">
          <p className="text-sm text-red-600">You must be logged in</p>
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-orange-100/80 bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] sm:mx-auto sm:max-w-md sm:rounded-[1.75rem] sm:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.6)]">
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-orange-200" />
        </div>

        <div className="flex items-center justify-between border-b border-orange-100/80 bg-white/85 px-6 pb-4 pt-4 backdrop-blur-sm">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Request to Join</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-label="Close request modal"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="rounded-2xl border border-orange-100/80 bg-white/95 p-5 shadow-[0_18px_35px_-32px_rgba(15,23,42,0.55)]">
            <h3 className="text-lg font-bold text-slate-900">{summary?.title ?? "Activity"}</h3>
            <div className="mt-3 space-y-2.5 text-sm text-slate-600">
              <p>👤 Hosted by <span className="font-medium">{hostName}</span></p>
              <p>📅 {summary?.starts_at ? new Date(summary.starts_at).toLocaleString() : "Date TBD"}</p>
              <p>📍 {summary?.location_name || "Location shared after approval"}</p>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Host Questions</span>
            <span className="h-px flex-1 bg-orange-100" />
          </div>

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{q}</p>
                  <textarea
                    value={answers[index] ?? ""}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[index] = e.target.value;
                      setAnswers(updated);
                    }}
                    placeholder="Type your answer..."
                    className="w-full resize-none rounded-xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No host questions for this activity.</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t border-orange-100/80 bg-white/90 p-6 pb-10 backdrop-blur-sm">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f97316] bg-[#f97316] py-4 font-bold text-white shadow-[0_18px_30px_-20px_rgba(249,115,22,0.8)] transition-all duration-200 hover:bg-[#ea6a11] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
          >
            <span>{loading ? "Sending..." : "Send Request"}</span>
            <span>➤</span>
          </button>
          <p className="mt-4 text-center text-[11px] text-slate-400">
            The host will review your request and you&apos;ll be notified of their decision.
          </p>
        </div>
      </div>
    </div>
  );
}