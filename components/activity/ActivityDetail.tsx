"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/chat/ChatModal";
import { supabase } from "@/lib/supabaseClient";

type ViewerRole = "guest" | "host";
type JoinStatus = "none" | "pending" | "approved" | "rejected";

type ActivityDetailProps = {
  activity: any;
};

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const [openJoin, setOpenJoin] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [viewerRole, setViewerRole] = useState<ViewerRole>("guest");
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("none");
  const [hasUnread, setHasUnread] = useState(false);

  /**
   * 1️⃣ Determine viewer role (host vs guest)
   */
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setViewerRole("guest");
        return;
      }

      setViewerRole(user.id === activity.host_id ? "host" : "guest");
    };

    run();
  }, [activity.host_id]);

  /**
   * 2️⃣ SINGLE SOURCE OF TRUTH for join status
   *    (this is the most important function)
   */
  const computeJoinStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      setJoinStatus("none");
      return;
    }
  
    // Host is always approved
    if (user.id === activity.host_id) {
      setJoinStatus("approved");
      return;
    }
  
    const { data: requests, error } = await supabase
      .from("join_requests")
      .select("status")
      .eq("activity_id", activity.id)
      .eq("requester_id", user.id)
      .limit(1);
  
    if (error) {
      console.error("join status error", error);
      setJoinStatus("none");
      return;
    }
  
    setJoinStatus(requests?.[0]?.status ?? "none");
  };
  
  const checkUnread = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
  
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("activity_id", activity.id)
      .maybeSingle();
  
    if (!conversation) {
      setHasUnread(false);
      return;
    }
  
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("last_seen_at")
      .eq("conversation_id", conversation.id)
      .eq("user_id", user.id)
      .maybeSingle();
  
    const { data: latestMessage } = await supabase
      .from("messages")
      .select("created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (
      latestMessage &&
      (!participant?.last_seen_at ||
        new Date(latestMessage.created_at) >
          new Date(participant.last_seen_at))
    ) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }
  }, [activity.id]);

  useEffect(() => {
    checkUnread();
  }, [checkUnread]);  
  
  /**
   * 3️⃣ Fetch join status on load
   */
  useEffect(() => {
    computeJoinStatus();
  }, [activity.id]);

  const canOpenChat =
    viewerRole === "host" ||
    (viewerRole === "guest" && joinStatus === "approved");

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Title */}
      <section className="px-4 pt-6">
        <h1 className="text-xl font-semibold">{activity.title}</h1>
        <span className="mt-2 inline-block rounded-full border px-3 py-1 text-xs text-gray-600">
          {activity.type === "group" ? "Group activity" : "One-on-one activity"}
        </span>
      </section>

      {/* Time & Location */}
      <section className="mt-6 px-4 space-y-2 text-sm">
        <p>🕒 {new Date(activity.starts_at).toLocaleString()}</p>
        <p>📍 {joinStatus === "approved" ? activity.location : "Hidden"}</p>
      </section>

      {/* Cost */}
      <section className="mt-6 px-4">
        <h2 className="text-sm font-semibold">Expenses</h2>
        <p className="text-sm text-gray-600">
          {activity.cost_rule === "everyone_pays" && "Everyone pays their own"}
          {activity.cost_rule === "host_pays" && "Host covers it"}
          {activity.cost_rule === "split" && "Split equally"}
        </p>
      </section>

      {/* About */}
      <section className="mt-6 px-4">
        <h2 className="text-sm font-semibold">About</h2>
        <p className="text-sm text-gray-600">{activity.description}</p>
      </section>

      {/* Actions */}
      <section className="mt-8 px-4 pb-6 space-y-3">

        {/* GUEST STATES */}
        {viewerRole === "guest" && joinStatus === "none" && (
          <button
            onClick={() => setOpenJoin(true)}
            className="w-full rounded-xl bg-black py-3 text-white"
          >
            Request to Join
          </button>
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
              Your request was approved
            </p>
            <button
              onClick={() => setOpenChat(true)}
              className="w-full rounded-xl bg-black py-3 text-white relative"
            >
              Open Chat
              {hasUnread && (
                <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </>
        )}

        {/* HOST */}
        {viewerRole === "host" && (
          <>
            <button
              onClick={() => setOpenReview(true)}
              className="w-full rounded-xl bg-black py-3 text-white"
            >
              Review Requests
            </button>

            <button
              onClick={() => setOpenChat(true)}
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


      {/* Join Request Modal */}
      <JoinRequestModal
        open={openJoin}
        onClose={() => setOpenJoin(false)}
        activityId={activity.id}
        hostId={activity.host_id}
        questions={activity.questions || []} // 🔑 THIS WAS MISSING
        onSuccess={async () => {
          await computeJoinStatus();
          setOpenJoin(false);
        }}
      />


      {/* Host Review Modal */}
      <HostReviewModal
        open={openReview}
        onClose={() => setOpenReview(false)}
        activityId={activity.id}
        onResolved={async () => {
          await computeJoinStatus(); // 🔥 HOST SIDE FIX
        }}
      />

      {/* Chat */}
      {canOpenChat && (
        <ChatModal
        open={openChat}
        activityId={activity.id}
        onClose={() => setOpenChat(false)}
        onChatClosed={checkUnread} // 🔥 THIS IS THE KEY
      />            
      )}
    </main>
  );
}