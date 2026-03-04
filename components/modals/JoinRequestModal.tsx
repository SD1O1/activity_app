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
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white sm:mx-auto sm:max-w-md">
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-4 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Request to Join</h2>
          <button onClick={onClose} className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100" aria-label="Close request modal">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h3 className="text-lg font-bold text-gray-900">{summary?.title ?? "Activity"}</h3>
            <div className="mt-3 space-y-2.5 text-sm text-gray-600">
              <p>👤 Hosted by <span className="font-medium">{hostName}</span></p>
              <p>📅 {summary?.starts_at ? new Date(summary.starts_at).toLocaleString() : "Date TBD"}</p>
              <p>📍 {summary?.location_name || "Location shared after approval"}</p>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Host Questions</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{q}</p>
                  <textarea
                    value={answers[index] ?? ""}
                    onChange={(e) => {
                      const updated = [...answers];
                      updated[index] = e.target.value;
                      setAnswers(updated);
                    }}
                    placeholder="Type your answer..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#ff6b00] focus:ring-[#ff6b00]"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No host questions for this activity.</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="border-t border-gray-100 bg-white p-6 pb-10">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            <span>{loading ? "Sending..." : "Send Request"}</span>
            <span>➤</span>
          </button>
          <p className="mt-4 text-center text-[11px] text-gray-400">
            The host will review your request and you&apos;ll be notified of their decision.
          </p>
        </div>
      </div>
    </div>
  );
}
