"use client";

import { useEffect, useState } from "react";
import { hasReported } from "@/lib/reporting";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type JoinStatus = "none" | "pending" | "approved" | "rejected";
type ViewerRole = "guest" | "host";

type Props = {
  activityId: string;
  viewerRole: ViewerRole;
  joinStatus: JoinStatus;
  hasUnread: boolean;
  onRequestJoin: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
  onReport: () => void;
};

export default function ActivityActions({
  activityId,
  viewerRole,
  joinStatus,
  hasUnread,
  onRequestJoin,
  onOpenChat,
  onOpenReview,
  onReport,
}: Props) {
  const [alreadyReported, setAlreadyReported] = useState(false);
  const { user } = useClientAuthProfile();

  useEffect(() => {
    if (!user) return;

    hasReported({
      reporterId: user.id,
      targetType: "activity",
      targetId: activityId,
    }).then(setAlreadyReported);
  }, [user, activityId]);

  return (
    <section className="mt-8 px-4 pb-6 space-y-3">
      {/* GUEST ACTIONS */}
      {viewerRole === "guest" && joinStatus === "none" && (
        <button
          onClick={onRequestJoin}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Request to Join
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "pending" && (
        <button disabled className="w-full rounded-xl border py-3 text-gray-500">
          Request Sent
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "rejected" && (
        <button disabled className="w-full rounded-xl border py-3 text-red-500">
          Your request was declined
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "approved" && (
        <>
          <p className="text-sm text-green-600 text-center">
            Your request was approved
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
        </>
      )}

      {/* HOST ACTIONS */}
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

      {/* REPORT (guest only, disabled if already reported) */}
      {viewerRole === "guest" && (
        <button
          disabled={alreadyReported}
          onClick={() => {
            if (!alreadyReported) onReport();
          }}
          className={`w-full rounded-xl py-3 text-sm border ${
            alreadyReported
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600"
          }`}
        >
          {alreadyReported ? "Reported" : "Report activity"}
        </button>
      )}
    </section>
  );
}