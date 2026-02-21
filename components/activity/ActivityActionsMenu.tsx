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
      <button onClick={() => setOpen((v) => !v)} className="text-xl">
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          <button onClick={handleShare} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
            Share activity
          </button>

          {canLeaveActivity && user && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 disabled:opacity-60"
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
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
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
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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