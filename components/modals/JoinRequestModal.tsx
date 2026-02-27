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
  activityTitle?: string;
  hostName?: string | null;
  startsAt?: string;
  locationName?: string;
};

const formatSchedule = (startsAt?: string, locationName?: string) => {
  if (!startsAt && !locationName) return "";

  const dateText = startsAt
    ? new Date(startsAt).toLocaleString([], {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  if (dateText && locationName) return `${dateText} • ${locationName}`;
  return dateText || locationName || "";
};

export default function JoinRequestModal({
  open,
  onClose,
  activityId,
  hostId,
  questions,
  userId,
  onSuccess,
  activityTitle,
  hostName,
  startsAt,
  locationName,
}: JoinRequestModalProps) {
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const resetAndClose = () => {
    setAnswers(questions.map(() => ""));
    setError(null);
    onClose();
  };
  if (!open) return null;

  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4">
        <div className="h-[90vh] w-full overflow-hidden rounded-t-[26px] bg-[#f3f3f3] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[26px]">
          <div className="p-6">
            <p className="text-sm text-red-600">You must be logged in</p>
          </div>
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

  const scheduleText = formatSchedule(startsAt, locationName);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4">
      <div className="h-[90vh] w-full overflow-hidden rounded-t-[26px] bg-[#f3f3f3] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[26px]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#d8d8d8] px-6 py-7">
            <h2 className="text-[42px] font-medium leading-none tracking-[-0.02em] text-[#1f1f23] md:text-[34px]">
              Request to Join
            </h2>
            <button onClick={resetAndClose} className="text-4xl leading-none text-[#5a5a5a]" aria-label="Close">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            {(activityTitle || hostName || scheduleText) && (
              <div className="mb-8 rounded-3xl bg-[#ececec] p-6">
                {activityTitle && <h3 className="text-[42px] font-medium leading-[1.1] text-[#1f1f23] md:text-[44px]">{activityTitle}</h3>}
                {hostName && <p className="mt-4 text-[22px] text-[#5a5a5a]">👤 Hosted by {hostName}</p>}
                {scheduleText && <p className="mt-2 text-[22px] text-[#5a5a5a]">🕒 {scheduleText}</p>}
              </div>
            )}

            {questions.length > 0 && (
              <div>
                <h3 className="mb-4 text-[40px] font-medium leading-none text-[#1f1f23] md:text-[34px]">Host Questions</h3>
                <div className="space-y-7">
                  {questions.map((q, index) => (
                    <div key={index}>
                      <p className="mb-3 text-[22px] leading-[1.25] text-[#4a4a4a]">{q}</p>
                      <textarea
                        value={answers[index]}
                        onChange={(e) => {
                          const updated = [...answers];
                          updated[index] = e.target.value;
                          setAnswers(updated);
                        }}
                        className="min-h-[170px] w-full resize-y rounded-3xl border border-[#cfcfcf] bg-[#f6f6f6] p-4 text-[20px] text-[#2c2c31] outline-none focus:border-[#b8b8b8]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-[22px] text-red-600">{error}</p>}
          </div>

          <div className="border-t border-[#d8d8d8] px-6 pb-7 pt-5">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-3xl bg-black py-4 text-[24px] font-medium text-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}