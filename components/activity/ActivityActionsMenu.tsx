"use client";

import { useState } from "react";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type Props = {
  isHost: boolean;
  canLeaveActivity?: boolean;
  onLeaveActivity?: () => Promise<void> | void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

export default function ActivityActionsMenu({
  isHost,
  canLeaveActivity = false,
  onLeaveActivity,
  onEdit,
  onDelete,
  onReport,
}: Props) {
  const { user } = useClientAuthProfile();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleShare = async () => {
    await navigator.share?.({
      url: window.location.href,
    });
    setOpen(false);
  };

  const handleLeave = async () => {
    const confirmed = confirm("Leave this activity?");
    if (!confirmed) return;
    if (!onLeaveActivity || leaving) return;

    setLeaving(true);
    try {
      await onLeaveActivity();
      setOpen(false);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full px-2 py-1 text-2xl text-[#c97a2b] transition-colors hover:bg-orange-50 hover:text-[#ee8c2b]"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-lg border border-orange-100/90 bg-gradient-to-b from-[#fffaf6] to-white shadow-[0_20px_30px_-22px_rgba(249,115,22,0.7)]">
          <button onClick={handleShare} className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-orange-50">
            Share activity
          </button>

          {canLeaveActivity && user && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="w-full px-4 py-2 text-left text-sm font-medium text-[#c2410c] transition-colors hover:bg-orange-100/70 disabled:opacity-60"
            >
              {leaving ? "Leaving…" : "Leave activity"}
            </button>
          )}

          {user && !isHost && (
            <button
              onClick={() => {
                onReport();
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-[#c2410c] transition-colors hover:bg-orange-100/70"
            >
              Report activity
            </button>
          )}

          {isHost && (
            <>
              <button
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-orange-50"
              >
                Edit activity
              </button>

              <button
                onClick={() => {
                  const ok = confirm("Delete this activity permanently?");
                  if (!ok) return;
                  onDelete();
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-[#c2410c] transition-colors hover:bg-orange-100/70"
              >
                Delete activity
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
