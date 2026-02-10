"use client";

import { useState } from "react";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type JoinStatus = "none" | "pending" | "approved" | "rejected";
type ViewerRole = "guest" | "host";
type ActivityStatus = "open" | "full" | "completed";

type Props = {
  activityId: string;
  viewerRole: ViewerRole;
  joinStatus: JoinStatus;
  activityStatus: ActivityStatus;
  hasUnread: boolean;
  onRequestJoin: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
};

export default function ActivityActions({
  activityId,
  viewerRole,
  joinStatus,
  activityStatus,
  hasUnread,
  onRequestJoin,
  onOpenChat,
  onOpenReview,
}: Props) {
  const { user } = useClientAuthProfile();
  const [leaving, setLeaving] = useState(false);

  const handleLeaveActivity = async () => {
    if (!user || leaving) return;

    setLeaving(true);

    try {
      await fetch("/api/activities/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          userId: user.id,
        }),
      });

      // simplest & safest for now
      window.location.reload();
    } catch (err) {
      console.error("Failed to leave activity", err);
      setLeaving(false);
    }
  };

  return (
    <section className="mt-8 px-4 pb-6 space-y-3">
      {/* ───────────────── GUEST ACTIONS ───────────────── */}

      {viewerRole === "guest" && (
        <>
          {/* OPEN */}
          {joinStatus === "none" && activityStatus === "open" && (
            <button
              onClick={onRequestJoin}
              className="w-full rounded-xl bg-black py-3 text-white"
            >
              Request to Join
            </button>
          )}

          {/* FULL */}
          {activityStatus === "full" && (
            <button
              disabled
              className="w-full rounded-xl border py-3 text-gray-500 cursor-not-allowed"
            >
              Activity is full
            </button>
          )}

          {/* COMPLETED */}
          {activityStatus === "completed" && (
            <button
              disabled
              className="w-full rounded-xl border py-3 text-gray-500 cursor-not-allowed"
            >
              Activity completed
            </button>
          )}
        </>
      )}

      {viewerRole === "guest" && joinStatus === "pending" && (
        <button
          disabled
          className="w-full rounded-xl border py-3 text-gray-500"
        >
          Request Sent
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "rejected" && (
        <button
          disabled
          className="w-full rounded-xl border py-3 text-red-500"
        >
          Your request was declined
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "approved" && (
        <>
          <p className="text-sm text-green-600 text-center">
            You have joined this activity
          </p>

          <button
            onClick={onOpenChat}
            className="w-full rounded-xl bg-black py-3 text-white relative"
          >
            Open Chat
            {hasUnread && (
              <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={handleLeaveActivity}
            disabled={leaving}
            className="w-full rounded-xl border py-3 text-red-600"
          >
            {leaving ? "Leaving…" : "Leave Activity"}
          </button>
        </>
      )}

      {/* ───────────────── HOST ACTIONS ───────────────── */}

      {viewerRole === "host" && (
        <>
          <button
            onClick={onOpenReview}
            className="w-full rounded-xl bg-black py-3 text-white"
          >
            Review Requests
          </button>

          <button
            onClick={onOpenChat}
            className="w-full rounded-xl border py-3 relative"
          >
            Open Chat
            {hasUnread && (
              <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </>
      )}
    </section>
  );
}