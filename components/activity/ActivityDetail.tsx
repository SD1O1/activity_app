"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/chat/ChatModal";
import AuthModal from "@/components/modals/AuthModal";

import ActivityHeader from "./ActivityHeader";
import ActivityMeta from "./ActivityMeta";
import ActivityAbout from "./ActivityAbout";
import ActivityActions from "./ActivityActions";

import { useViewerRole } from "@/hooks/useViewerRole";
import { useJoinStatus } from "@/hooks/useJoinStatus";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type Props = {
  activity: any;
};

export default function ActivityDetail({ activity }: Props) {
  const viewerRole = useViewerRole(activity.host_id);
  const { joinStatus, computeJoinStatus } = useJoinStatus(
    activity.id,
    activity.host_id
  );
  const { hasUnread, checkUnread } = useUnreadChat(activity.id);

  const [openJoin, setOpenJoin] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);

  const {
    user,
    profileCompleted,
    loading,
  } = useClientAuthProfile();
  
  const userId = user?.id ?? null;  

  const canOpenChat =
    viewerRole === "host" ||
    (viewerRole === "guest" && joinStatus === "approved");

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

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <ActivityHeader title={activity.title} type={activity.type} />

      <ActivityMeta
        startsAt={activity.starts_at}
        location={activity.location}
        showLocation={joinStatus === "approved"}
        costRule={activity.cost_rule}
      />

      <ActivityAbout description={activity.description} />

      <ActivityActions
        viewerRole={viewerRole}
        joinStatus={joinStatus}
        hasUnread={hasUnread}
        onRequestJoin={handleRequestJoin}
        onOpenChat={() => setOpenChat(true)}
        onOpenReview={() => setOpenReview(true)}
      />

      <JoinRequestModal
        open={openJoin}
        onClose={() => setOpenJoin(false)}
        activityId={activity.id}
        hostId={activity.host_id}
        questions={activity.questions || []}
        userId={userId}
        onSuccess={async () => {
          await computeJoinStatus();
          setOpenJoin(false);
        }}
      />

      <HostReviewModal
        open={openReview}
        onClose={() => setOpenReview(false)}
        activityId={activity.id}
        hostId={activity.host_id}   // ✅ ADD THIS
        onResolved={computeJoinStatus}
      />

      {canOpenChat && (
        <ChatModal
          open={openChat}
          activityId={activity.id}
          onClose={() => setOpenChat(false)}
          onChatClosed={checkUnread}
        />
      )}

      <AuthModal
        open={openAuth}
        onClose={() => setOpenAuth(false)}
      />
    </main>
  );
}