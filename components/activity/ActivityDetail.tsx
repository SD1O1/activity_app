"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/chat/ChatModal";
import AuthModal from "@/components/modals/AuthModal";
import ReportModal from "@/components/modals/ReportModal";
import EditActivityModal from "../modals/EditActivityModal";
import HostMiniProfile from "../profile/HostMiniProfile";
import ActivityHeader from "./ActivityHeader";
import ActivityMeta from "./ActivityMeta";
import ActivityAbout from "./ActivityAbout";
import ActivityActions from "./ActivityActions";
import ActivityLocationMap from "@/components/map/ActivityLocationMap";
import ParticipantsRow from "./ParticipantsRow";
import ActivityActionsMenu from "@/components/activity/ActivityActionsMenu";
import { useViewerRole } from "@/hooks/useViewerRole";
import { useJoinStatus } from "@/hooks/useJoinStatus";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { ActivityDetailItem, normalizeActivityTags } from "@/types/activity";

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

  useEffect(() => {
    if (!activity.id) return;

    const loadParticipants = async () => {
      const res = await fetch(`/api/activities/${activity.id}/participants`);
      if (!res.ok) return;

      const data: Participant[] = await res.json();
      setParticipants(data);
    };

    void loadParticipants();
  }, [activity.id]);

  const tags = normalizeActivityTags(activity.activity_tag_relations);

  const canOpenChat = viewerRole === "host" || (viewerRole === "guest" && joinStatus === "approved");

  const handleRequestJoin = () => {
    if (loading) return;

    if (!user) {
      setOpenAuth(true);
      return;
    }

    if (!profileCompleted) {
      window.location.href = "/onboarding/profile";
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
      body: JSON.stringify({
        activityId: activity.id,
        userId,
      }),
    });

    if (!res.ok) {
      alert("Failed to remove member");
      return;
    }

    setParticipants((prev) => prev.filter((participant) => participant.id !== userId));
  };

  const handleLeaveActivity = async () => {
    if (!user) return;

    const res = await fetch("/api/activities/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: activity.id,
        userId: user.id,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error || "Failed to leave activity");
      return;
    }

    await computeJoinStatus();
    setParticipants((prev) => prev.filter((participant) => participant.id !== user.id));
  };

  const isHost = viewerRole === "host";
  const isApprovedGuest = joinStatus === "approved";
  const showExactMap = isHost || isApprovedGuest;

  const lat = showExactMap && activity.exact_lat != null ? activity.exact_lat : activity.public_lat ?? activity.exact_lat;

  const lng = showExactMap && activity.exact_lng != null ? activity.exact_lng : activity.public_lng ?? activity.exact_lng;

  return (
    <main className="min-h-screen bg-white">
      <Header
        rightSlot={
          <ActivityActionsMenu
            isHost={viewerRole === "host"}
            onEdit={() => setOpenEdit(true)}
            canLeaveActivity={joinStatus === "approved" && activity.status !== "completed"}
            onLeaveActivity={handleLeaveActivity}
            onDelete={async () => {
              await fetch(`/api/activities/${activity.id}/delete`, {
                method: "POST",
              });
              router.replace("/activities");
            }}
            onReport={() => setOpenReport(true)}
          />
        }
      />

      <ActivityHeader title={activity.title} type={activity.type} tags={tags} />

      <div className="px-4 mt-4">
        {activity.host && <HostMiniProfile host={activity.host} clickable size="md" />}
      </div>

      <ActivityMeta
        startsAt={activity.starts_at}
        location={activity.location_name}
        costRule={activity.cost_rule}
        memberCount={activity.member_count}
        maxMembers={activity.max_members}
        showMemberProgress={activity.type === "group"}
        lat={activity.public_lat}
        lng={activity.public_lng}
      />

      <ActivityLocationMap lat={Number(lat)} lng={Number(lng)} blurred={!showExactMap} />

      <ActivityAbout description={activity.description} />

      <ActivityActions
        viewerRole={viewerRole}
        joinStatus={joinStatus}
        hasUnread={hasUnread}
        onRequestJoin={handleRequestJoin}
        onOpenChat={() => setOpenChat(true)}
        onOpenReview={() => setOpenReview(true)}
        activityStatus={activity.status}
      />

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
        onSuccess={async () => {
          await computeJoinStatus();
          setOpenJoin(false);
        }}
      />

      <HostReviewModal
        open={openReview}
        onClose={() => setOpenReview(false)}
        onResolved={computeJoinStatus}
      />

      {canOpenChat && (
        <ChatModal open={openChat} activityId={activity.id} onClose={() => setOpenChat(false)} onChatClosed={checkUnread} />
      )}

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