"use client";
import Header from "@/components/layout/Header";
import { useState } from "react";
import JoinRequestModal from "@/components/modals/JoinRequestModal";
import HostReviewModal from "@/components/modals/HostReviewModal";
import ChatModal from "@/components/modals/ChatModal";

type ViewerRole= "guest" | "host";

export default function ActivityDetail() {

    const [openJoin, setOpenJoin] = useState(false);
    const [openReview, setOpenReview] = useState(false);
    const [openChat, setOpenChat] = useState(false);
    const [joinStatus, setJoinStatus] = useState<"none" | "pending" | "approved">("approved");
    const [viewerRole, setViewerRole] = useState<ViewerRole>("guest"); // change to test
    

    return (
      <main className="min-h-screen bg-white">
        {/* Header placeholder (will reuse global header later) */}
        <Header />
        {/* Activity Title */}
        <section className="px-4 pt-6">
          <h1 className="text-xl font-semibold">
            Evening Coffee & Conversation
          </h1>
  
          <span className="mt-2 inline-block rounded-full border px-3 py-1 text-xs text-gray-600">
            Group activity
          </span>
        </section>
  
        {/* Map / Location Preview */}
        <section className="mt-6 px-4">
          {joinStatus === "approved" ? (
           <div className="h-40 rounded-xl border bg-gray-200">
             {/* Real map later */}
           </div>
        ) : (
           <div className="flex h-40 items-center justify-center rounded-xl border bg-gray-100 text-sm text-gray-500">
             Location hidden until approval
           </div>
        )}
       </section>
  
        {/* Host Info */}
        <section className="mt-6 px-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Hosted by
          </h2>
  
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
              A
            </div>
  
            <div>
              <p className="text-sm font-medium">
                Alex, 27
              </p>
              <p className="text-xs text-gray-500">
                Verified profile
              </p>
            </div>
          </div>
        </section>
  
        {/* Activity Details */}
        <section className="mt-6 px-4 space-y-2 text-sm text-gray-700">
          <p>🕒 Today, 6:00 PM</p>
          <p>📍 Around Central Park</p>
          <p>👥 Group activity</p>
        </section>
  
        {/* Expenses */}
        <section className="mt-6 px-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Expenses
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Everyone pays for themselves
          </p>
        </section>
  
        {/* About */}
        <section className="mt-6 px-4">
          <h2 className="text-sm font-semibold text-gray-700">
            About this activity
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            A relaxed coffee meetup for good conversations and meeting new people.
          </p>
        </section>
  
        {/* Action Button */}      
        <section className="mt-8 px-4 pb-6">
          {/* Guest – not requested */}
          {viewerRole === "guest" && joinStatus === "none" && (
            <button
              onClick={() => setOpenJoin(true)}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
            >
              Request to Join
            </button>
          )}

          {/* Guest – pending */}
          {viewerRole === "guest" && joinStatus === "pending" && (
            <button
              disabled
              className="w-full rounded-xl border py-3 text-sm text-gray-500"
            >
              Request Sent
            </button>
          )}

          {/* Guest – approved */}
          {viewerRole === "guest" && joinStatus === "approved" && (
            <button
              onClick={() => setOpenChat(true)}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
            >
              Open Chat
            </button>
          )}

          {viewerRole === "host" && joinStatus === "approved" && (
            <button
              onClick={() => setOpenChat(true)}
              className="w-full rounded-xl bg-black py-3 text-white"
            >
              Open Chat
            </button>
          )}

          {/* Host */}
          {viewerRole === "host" && (
            <button
              onClick={() => setOpenReview(true)}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
            >
              Review Requests
            </button>
          )}
        </section>

        <JoinRequestModal
          open={openJoin}
          onClose={() => setOpenJoin(false)}
          onSubmit={() => {
            setJoinStatus("pending");
            setOpenJoin(false);
          }}
        />

        <HostReviewModal
          open={openReview}
          onClose={() => setOpenReview(false)}
          onAccept={() => {
            setJoinStatus("approved");
            setOpenReview(false);
          }}
        />

        <ChatModal
          open={openChat}
          onClose={() => setOpenChat(false)}
        />

      </main>
    );
  }