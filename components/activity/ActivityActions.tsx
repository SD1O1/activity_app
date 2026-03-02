"use client";

import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type JoinStatus = "none" | "pending" | "approved" | "rejected";
type ViewerRole = "guest" | "host";
type ActivityStatus = string;

type Props = {
  viewerRole: ViewerRole;
  joinStatus: JoinStatus;
  activityStatus: ActivityStatus;
  hasUnread: boolean;
  onRequestJoin: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
};

export default function ActivityActions({
  viewerRole,
  joinStatus,
  activityStatus,
  hasUnread,
  onRequestJoin,
  onOpenChat,
  onOpenReview,
}: Props) {
  const { user } = useClientAuthProfile();

  const isLoggedIn = Boolean(user);
  const isCompleted = activityStatus === "completed";
  const isGuestParticipant = viewerRole === "guest" && joinStatus === "approved";

  let ctaLabel = "Request to Join";
  let disabled = false;
  let ctaAction: (() => void) | undefined = onRequestJoin;
  let buttonClass = "bg-amber-500 text-white";

  if (viewerRole === "host") {
    ctaLabel = isCompleted ? "Activity completed" : "Review Requests";
    ctaAction = isCompleted ? undefined : onOpenReview;
    disabled = isCompleted;
    buttonClass = isCompleted ? "bg-neutral-300 text-neutral-600" : "bg-amber-500 text-white";
  } else if (joinStatus === "pending") {
    ctaLabel = "Review Request";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-amber-500/90 text-white";
  } else if (joinStatus === "approved") {
    ctaLabel = isCompleted ? "Activity completed" : "Joined";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-neutral-300 text-neutral-600";
  } else if (joinStatus === "rejected") {
    ctaLabel = "Request declined";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-neutral-300 text-neutral-600";
  } else if (activityStatus === "full") {
    ctaLabel = "Activity is full";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-neutral-300 text-neutral-600";
  } else if (isCompleted && isLoggedIn) {
    ctaLabel = "Activity completed";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-neutral-300 text-neutral-600";
  }

  const canOpenChat = (viewerRole === "host" || isGuestParticipant) && !isCompleted;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
        <button
          onClick={ctaAction}
          disabled={disabled}
          className={`h-14 flex-1 rounded-full px-5 text-lg font-semibold transition ${buttonClass} disabled:cursor-not-allowed`}
        >
          {ctaLabel}
        </button>

        <button
          onClick={onOpenChat}
          disabled={!canOpenChat}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-neutral-100 text-xl text-neutral-700 disabled:opacity-60"
          aria-label="Open chat"
          title={canOpenChat ? "Open chat" : "Chat available after joining"}
        >
          💬
          {hasUnread && canOpenChat && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />}
        </button>
      </div>
    </div>
  );
}
