"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/chat/ChatModal";
import AuthModal from "@/components/modals/AuthModal";
import ReportModal from "@/components/modals/ReportModal";
import HostMiniProfile from "../profile/HostMiniProfile";

import ActivityHeader from "./ActivityHeader";
import ActivityMeta from "./ActivityMeta";
import ActivityAbout from "./ActivityAbout";
import ActivityActions from "./ActivityActions";

import ActivityLocationMap from "@/components/map/ActivityLocationMap";

import { useViewerRole } from "@/hooks/useViewerRole";
import { useJoinStatus } from "@/hooks/useJoinStatus";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  activity: any;
};

type HostProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  verified: boolean;
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
  const [openReport, setOpenReport] = useState(false);
  const router = useRouter();

  const { user, profileCompleted, loading } = useClientAuthProfile();

  const tags =
    activity.activity_tag_relations?.map(
      (rel: any) => rel.activity_tags
    ) ?? [];

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

  /* MAP LOGIC */
  const isHost = viewerRole === "host";
  const isApprovedGuest = joinStatus === "approved";
  const showExactMap = isHost || isApprovedGuest;

  const lat =
    showExactMap && activity.exact_lat != null
      ? activity.exact_lat
      : activity.public_lat ?? activity.exact_lat;

  const lng =
    showExactMap && activity.exact_lng != null
      ? activity.exact_lng
      : activity.public_lng ?? activity.exact_lng;

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <ActivityHeader
        title={activity.title}
        type={activity.type}
        tags={tags}
      />

      {/* HOST SUMMARY */}
      <div className="px-4 mt-4">
      {activity.host && (
        <HostMiniProfile
          host={activity.host}
          clickable
          size="md"
        />
      )}
      </div>

      <ActivityMeta
        startsAt={activity.starts_at}
        location={activity.location_name}
        showLocation={joinStatus === "approved"}
        costRule={activity.cost_rule}
        lat={lat}
        lng={lng}
      />

      <ActivityLocationMap
        lat={Number(lat)}
        lng={Number(lng)}
        blurred={!showExactMap}
      />

      <ActivityAbout description={activity.description} />

      <ActivityActions
        activityId={activity.id}
        viewerRole={viewerRole}
        joinStatus={joinStatus}
        hasUnread={hasUnread}
        onRequestJoin={handleRequestJoin}
        onOpenChat={() => setOpenChat(true)}
        onOpenReview={() => setOpenReview(true)}
        onReport={() => setOpenReport(true)}
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
        activityId={activity.id}
        hostId={activity.host_id}
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