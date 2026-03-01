"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/chat/ChatModal";
import AuthModal from "@/components/modals/AuthModal";
import ReportModal from "@/components/modals/ReportModal";
import EditActivityModal from "../modals/EditActivityModal";
import ActivityLocationMap from "@/components/map/ActivityLocationMap";
import ParticipantsRow from "./ParticipantsRow";
import ActivityActionsMenu from "@/components/activity/ActivityActionsMenu";
import { useViewerRole } from "@/hooks/useViewerRole";
import { useJoinStatus } from "@/hooks/useJoinStatus";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { ActivityDetailItem, normalizeActivityTags } from "@/types/activity";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  activity: ActivityDetailItem;
};

type Participant = {
  id: string;
  username?: string | null;
  name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  role: "host" | "member";
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActivityDetail({ activity }: Props) {
  const viewerRole = useViewerRole(activity.host_id);
  const { joinStatus, computeJoinStatus } = useJoinStatus(activity.id, activity.host_id);
  const { hasUnread, checkUnread } = useUnreadChat(activity.id);

  const [openJoin, setOpenJoin] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const router = useRouter();
  const { user, profileCompleted, loading } = useClientAuthProfile();
  const { showToast } = useToast();

  useEffect(() => {
    if (!activity.id) return;

    const loadParticipants = async () => {
      const res = await fetch(`/api/activities/${activity.id}/participants`);
      if (!res.ok) {
        showToast("Failed to load participants", "error");
        return;
      }

      const payload = (await res.json()) as { data?: Participant[] };
      setParticipants(payload.data ?? []);
    };

    void loadParticipants();
  }, [activity.id, showToast]);

  const tags = normalizeActivityTags(activity.activity_tag_relations);
  const canOpenChat = viewerRole === "host" || (viewerRole === "guest" && joinStatus === "approved");

  const handleRequestJoin = () => {
    if (loading) return;

    if (!user) {
      setOpenAuth(true);
      return;
    }

    if (!profileCompleted) {
      router.push("/onboarding/profile");
      return;
    }

    setOpenJoin(true);
  };

  const handleRemove = async (userId: string) => {
    const confirmed = confirm("Are you sure you want to remove this user?");
    if (!confirmed) return;

    const res = await fetch("/api/activities/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: activity.id, userId }),
    });

    if (!res.ok) {
      showToast("Failed to remove member", "error");
      return;
    }

    setParticipants((prev) => prev.filter((participant) => participant.id !== userId));
  };

  const handleLeaveActivity = async () => {
    if (!user) return;

    const res = await fetch("/api/activities/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: activity.id, userId: user.id }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({} as { error?: string }));
      showToast(payload.error || "Failed to leave activity", "error");
      return;
    }

    await computeJoinStatus();
    setParticipants((prev) => prev.filter((participant) => participant.id !== user.id));
  };

  const isHost = viewerRole === "host";
  const isApprovedGuest = joinStatus === "approved";
  const isCompleted = activity.status === "completed";
  const showExactMap = isHost || isApprovedGuest;

  const lat = showExactMap && activity.exact_lat != null ? activity.exact_lat : activity.public_lat ?? activity.exact_lat;
  const lng = showExactMap && activity.exact_lng != null ? activity.exact_lng : activity.public_lng ?? activity.exact_lng;
  const hasValidCoords = typeof lat === "number" && typeof lng === "number";

  const cta = (() => {
    if (isCompleted) return { label: "Activity Completed", disabled: true, action: () => {} };

    if (viewerRole === "host") {
      return { label: "Review Request", disabled: false, action: () => setOpenReview(true) };
    }

    if (joinStatus === "approved") {
      return { label: "Joined", disabled: true, action: () => {} };
    }

    if (joinStatus === "pending") {
      return { label: "Request Sent", disabled: true, action: () => {} };
    }

    if (joinStatus === "rejected") {
      return { label: "Request Declined", disabled: true, action: () => {} };
    }

    if (activity.status === "full") {
      return { label: "Activity Full", disabled: true, action: () => {} };
    }

    return { label: "Join Activity", disabled: false, action: handleRequestJoin };
  })();

  return (
    <main className="mobile-app-container pb-24">
      <header className="sticky top-0 z-20 h-14 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-full w-full max-w-full items-center justify-between">
          <button onClick={() => router.back()} aria-label="Go back" className="text-lg leading-none text-gray-800">
            ←
          </button>
          <p className="text-[16px] font-semibold text-gray-900">Activity Details</p>
          <ActivityActionsMenu
            isHost={viewerRole === "host"}
            onEdit={() => setOpenEdit(true)}
            canLeaveActivity={viewerRole !== "host" && joinStatus === "approved" && activity.status !== "completed"}
            onLeaveActivity={handleLeaveActivity}
            onDelete={async () => {
              const res = await fetch(`/api/activities/${activity.id}/delete`, { method: "POST" });
              if (!res.ok) {
                const payload = await res.json().catch(() => ({} as { error?: string }));
                showToast(payload.error || "Failed to delete activity", "error");
                return;
              }

              showToast("Activity deleted", "success");
              router.replace("/activities");
            }}
            onReport={() => setOpenReport(true)}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-full pt-4">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1470&auto=format&fit=crop"
          alt="Activity"
          className="h-44 w-full rounded-2xl object-cover"
        />

        <h1 className="mt-4 text-[24px] md:text-[30px] font-bold leading-tight text-[#161212]">{activity.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {tags.length > 0 ? (
            <span className="rounded-full border border-[#f3d7bc] bg-[#fdf4eb] px-3 py-1.5 text-[12px] font-medium text-[#ef8f25] md:text-base">
              {tags[0].name}
            </span>
          ) : null}

          <span className="rounded-full bg-[#e9ebef] px-3 py-1.5 text-[12px] font-medium text-[#3d4658] md:text-base">
            {activity.type === "group" ? "Group Activity" : "1-on-1 Activity"}
          </span>

          {tags.slice(1).map((tag) => (
            <span key={tag.id} className="rounded-full bg-[#e9ebef] px-3 py-1.5 text-[12px] font-medium text-[#3d4658] md:text-base">
              {tag.name}
            </span>
          ))}
        </div>

        {activity.host && (
          <section className="mt-6 flex items-center gap-4 rounded-3xl bg-[#ededee] px-4 py-4 md:px-5">
            <img src={activity.host.avatar_url ?? "/avatar-placeholder.png"} alt={activity.host.name ?? "Host"} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="text-[16px] font-semibold text-[#18181b]">{activity.host.name ?? "Host"}</p>
              <p className="text-[13px] text-[#6b7280]">Host {activity.host.verified ? "✓" : ""}</p>
            </div>
          </section>
        )}

        <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#eceef2] p-4">
            <p className="text-sm md:text-base text-[#6b7280]">Date</p>
            <p className="mt-1 text-[16px] font-semibold text-[#16181d]">{formatDate(activity.starts_at)}</p>
          </div>

          <div className="rounded-2xl bg-[#eceef2] p-4">
            <p className="text-sm md:text-base text-[#6b7280]">Time</p>
            <p className="mt-1 text-[16px] font-semibold text-[#16181d]">{formatTime(activity.starts_at)}</p>
          </div>

          <div className="rounded-2xl bg-[#eceef2] p-4">
            <p className="text-sm md:text-base text-[#6b7280]">Cost</p>
            <p className="mt-1 text-[16px] font-semibold text-[#16181d]">{activity.cost_rule === "free" ? "Free" : activity.cost_rule}</p>
          </div>

          <div className="rounded-2xl bg-[#eceef2] p-4">
            <p className="text-sm md:text-base text-[#6b7280]">{activity.type === "group" ? "Group Activity" : "1-on-1 Activity"}</p>
            <p className="mt-1 text-[16px] font-semibold text-[#16181d]">
              {activity.type === "group" ? `${activity.member_count}/${activity.max_members} Joined` : "Private"}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[16px] font-semibold text-[#16181d]">About this activity</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#374151]">{activity.description}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-[16px] font-semibold text-[#16181d]">Location</h2>
          <p className="mt-3 text-[14px] text-[#4b5563]">{activity.location_name}</p>
          <p className="text-[13px] text-[#9ca3af]">Tap map for directions</p>
        </section>
      </div>

      {hasValidCoords && (
        <div className="mx-auto w-full max-w-full">
          <ActivityLocationMap lat={lat} lng={lng} blurred={!showExactMap} />
        </div>
      )}

      {participants.length > 0 && (isHost || isApprovedGuest) && (
        <div className="mx-auto w-full max-w-full pb-4">
          <ParticipantsRow
            participants={participants}
            currentUserId={user?.id}
            isHost={user?.id === activity.host_id}
            isJoined={joinStatus === "approved"}
            onOpenProfile={(participant) => {
              if (!participant.username) return;
              router.push(`/u/${participant.username}`);
            }}
            onRemove={handleRemove}
          />
        </div>
      )}

      <div className="fixed bottom-0 right-4 z-20 border border-black/5 bg-white/95 px-3 py-3 backdrop-blur rounded-2xl shadow-sm md:right-6 lg:right-8">
        <div className="flex items-center gap-3">
          <button
            onClick={cta.action}
            disabled={cta.disabled}
            className={`h-11 min-w-[180px] rounded-xl text-[14px] md:min-w-[220px] md:text-[15px] font-semibold ${
              cta.disabled ? "bg-[#d9dce2] text-[#6b7280]" : "bg-[#ef8f25] text-white"
            }`}
          >
            {joinStatus === "approved" && <span className="mr-2">✓</span>}
            {cta.label}
          </button>

          <button
            onClick={() => canOpenChat && setOpenChat(true)}
            disabled={!canOpenChat}
            aria-label="Open chat"
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-[16px] ${
              canOpenChat ? "bg-[#e6e8ec] text-[#1f2937]" : "bg-[#eceef2] text-[#9ca3af]"
            }`}
          >
            💬
            {hasUnread && canOpenChat && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />}
          </button>
        </div>
      </div>

      <EditActivityModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        activity={activity}
        onUpdated={async () => {
          await computeJoinStatus();
        }}
      />

      <JoinRequestModal
        open={openJoin}
        onClose={() => setOpenJoin(false)}
        activityId={activity.id}
        hostId={activity.host_id}
        questions={activity.questions || []}
        userId={user?.id ?? null}
        activityTitle={activity.title}
        hostName={activity.host?.name}
        startsAt={activity.starts_at}
        locationName={activity.location_name}
        onSuccess={async () => {
          await computeJoinStatus();
          showToast("Join request sent", "success");
          setOpenJoin(false);
        }}
      />

      <HostReviewModal open={openReview} onClose={() => setOpenReview(false)} onResolved={computeJoinStatus} />

      {canOpenChat && (
        <ChatModal
          open={openChat}
          activityId={activity.id}
          activityTitle={activity.title}
          hostName={activity.host?.name}
          onClose={() => setOpenChat(false)}
          onChatClosed={checkUnread}
        />
      )}

      <AuthModal open={openAuth} onClose={() => setOpenAuth(false)} />

      {user && (
        <ReportModal
          open={openReport}
          onClose={() => setOpenReport(false)}
          targetType="activity"
          targetId={activity.id}
          reporterId={user.id}
        />
      )}
    </main>
  );
}