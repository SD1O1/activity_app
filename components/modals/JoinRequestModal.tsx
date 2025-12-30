"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type JoinRequestModalProps = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  hostId: string;
  questions: string[]; // 👈 REQUIRED
  onSuccess: () => Promise<void>;
};

export default function JoinRequestModal({
  open,
  onClose,
  activityId,
  hostId,
  questions,
  onSuccess,
}: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<string[]>(
    questions.map(() => "")
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);

    // 🔒 Mandatory validation ONLY if questions exist
    if (questions.length > 0) {
      const hasEmpty = answers.some(
        (a) => a.trim().length === 0
      );

      if (hasEmpty) {
        setError("Please answer all questions before submitting.");
        return;
      }
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    // prevent duplicate requests
    const { data: existing } = await supabase
      .from("join_requests")
      .select("id")
      .eq("activity_id", activityId)
      .eq("requester_id", auth.user.id)
      .maybeSingle();

    if (existing) {
      setLoading(false);
      return;
    }

    // create join request WITH answers
    await supabase.from("join_requests").insert({
      activity_id: activityId,
      requester_id: auth.user.id,
      status: "pending",
      answers: questions.length > 0 ? answers : [],
    });

    // notify host
    await supabase.from("notifications").insert({
      user_id: hostId,
      type: "join_request",
      message: "New join request for your activity",
      activity_id: activityId,
    });

    setLoading(false);
    await onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Request to Join</h2>
          <button onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>

        {/* QUESTIONS */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index}>
                <p className="mb-1 text-sm font-medium">{q}</p>
                <textarea
                  value={answers[index]}
                  onChange={(e) => {
                    const updated = [...answers];
                    updated[index] = e.target.value;
                    setAnswers(updated);
                  }}
                  className="w-full rounded-lg border p-2 text-sm"
                  rows={3}
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </div>
    </div>
  );
}