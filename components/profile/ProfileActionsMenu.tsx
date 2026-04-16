"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReportModal from "../modals/ReportModal";

interface ProfileActionsMenuProps {
  isSelf: boolean;
  profileId: string;
  username: string;
}

export function ProfileActionsMenu({ isSelf, profileId, username }: ProfileActionsMenuProps) {
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
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-2 py-1 text-3xl text-[#c97a2b] transition-colors hover:bg-orange-50 hover:text-[#ee8c2b]"
        aria-label="Profile actions"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-orange-100/90 bg-gradient-to-b from-[#fffaf6] to-white shadow-[0_20px_30px_-22px_rgba(249,115,22,0.7)]">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/u/${username}`);
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-orange-50"
          >
            Share profile
          </button>

          {!isSelf && (
            <>
              <button
                onClick={() => {
                  setReportOpen(true);
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-orange-50"
              >
                Report user
              </button>

              <button
                onClick={handleBlock}
                className="w-full px-4 py-2 text-left text-sm font-medium text-[#c2410c] transition-colors hover:bg-orange-100/70"
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
