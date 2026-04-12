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

export default function ActivityActions({ viewerRole, joinStatus, activityStatus, hasUnread, onRequestJoin, onOpenChat, onOpenReview }: Props) {
  const { user } = useClientAuthProfile();

  const isLoggedIn = Boolean(user);
  const isCompleted = activityStatus === "completed";
  const isGuestParticipant = viewerRole === "guest" && joinStatus === "approved";

  let ctaLabel = "Join Activity";
  let disabled = false;
  let ctaAction: (() => void) | undefined = onRequestJoin;
  let buttonClass = "bg-[#f97316] text-white shadow-[0_14px_24px_-16px_rgba(249,115,22,0.85)]";

  if (viewerRole === "host") {
    ctaLabel = isCompleted ? "Activity completed" : "Review Requests";
    ctaAction = isCompleted ? undefined : onOpenReview;
    disabled = isCompleted;
    buttonClass = isCompleted ? "bg-orange-100 text-slate-500" : "bg-[#f97316] text-white shadow-[0_14px_24px_-16px_rgba(249,115,22,0.85)]";
  } else if (joinStatus === "pending") {
    ctaLabel = "Review Request";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-[#f97316] text-white shadow-[0_14px_24px_-16px_rgba(249,115,22,0.85)]";
  } else if (joinStatus === "approved") {
    ctaLabel = isCompleted ? "Activity completed" : "Joined";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-orange-100 text-slate-500";
  } else if (joinStatus === "rejected") {
    ctaLabel = "Request declined";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-orange-100 text-slate-500";
  } else if (activityStatus === "full") {
    ctaLabel = "Activity is full";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-orange-100 text-slate-500";
  } else if (isCompleted && isLoggedIn) {
    ctaLabel = "Activity completed";
    ctaAction = undefined;
    disabled = true;
    buttonClass = "bg-orange-100 text-slate-500";
  }

  const canOpenChat = (viewerRole === "host" || isGuestParticipant) && !isCompleted;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/80 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-5">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <button
          onClick={ctaAction}
          disabled={disabled}
          className={`h-14 flex-1 rounded-full px-5 text-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${buttonClass} disabled:cursor-not-allowed`}
        >
          {ctaLabel}
        </button>

        <button
          onClick={onOpenChat}
          disabled={!canOpenChat}
          className="relative grid h-14 w-14 place-items-center rounded-full border border-orange-100 bg-orange-50 text-xl text-slate-700 transition-colors hover:bg-orange-100 disabled:opacity-60"
          aria-label="Open chat"
          title={canOpenChat ? "Open chat" : "Chat available after joining"}
        >
          🗨️
          {hasUnread && canOpenChat && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />}
        </button>
      </div>
    </div>
  );
}