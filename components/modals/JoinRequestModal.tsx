"use client";

import { useState } from "react";
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

export default function JoinRequestModal({
  open,
  onClose,
  activityId,
  hostId,
  questions,
  userId,
  onSuccess,
}: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<string[]>(
    questions.map(() => "")
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/40">
        <div className="w-full rounded-t-2xl bg-white p-4">
          <p className="text-sm text-red-600">
            You must be logged in
          </p>
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
      const hasEmpty = answers.some(
        (a) => a.trim().length === 0
      );
      if (hasEmpty) {
        setError(
          "Please answer all questions before submitting."
        );
        return;
      }
    }

    setLoading(true);

    // 🔒 BLOCK ENFORCEMENT
    const { blockedUserIds } =
      await getBlockedUserIds(supabase, user.id);

    if (blockedUserIds.includes(hostId)) {
      setError(
        "You cannot request to join this activity."
      );
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

    const payload = (await response.json()) as { error?: string; data?: { message?: string } };

    if (!response.ok) {
      setError(payload.error ?? "Failed to send join request");
      setLoading(false);
      return;
    }

    setLoading(false);
    await onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Request to Join
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index}>
                <p className="mb-1 text-sm font-medium">
                  {q}
                </p>
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
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
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