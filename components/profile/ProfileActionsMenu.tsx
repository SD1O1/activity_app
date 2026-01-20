"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReportModal from "../modals/ReportModal";

interface ProfileActionsMenuProps {
  isSelf: boolean;
  profileId: string;
  username: string;
}

export function ProfileActionsMenu({
  isSelf,
  profileId,
  username,
}: ProfileActionsMenuProps) {
  const [open, setOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reporterId, setReporterId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setReporterId(data.user.id);
      }
    });
  }, []);


  async function handleBlock() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: profileId,
    });

    setOpen(false);

    // Redirect away from blocked profile
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-gray-500 hover:text-black"
        aria-label="Profile actions"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-40 rounded-lg border bg-white shadow-md z-50">
          {/* SHARE */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/u/${username}`
              );
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Share profile
          </button>

          {!isSelf && (
            <>
              {/* REPORT (placeholder) */}
              <button
                onClick={() => {
                  setReportOpen(true);
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Report user
              </button>

              {/* BLOCK */}
              <button
                onClick={handleBlock}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
              >
                Block user
              </button>
            </>
          )}
        </div>
      )}
      {reporterId && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="profile"
          targetId={profileId}
          reporterId={reporterId}
        />
      )}
    </div>
  );
}