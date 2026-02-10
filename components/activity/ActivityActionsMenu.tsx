"use client";

import { useState } from "react";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";

type Props = {
  isHost: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

export default function ActivityActionsMenu({
  isHost,
  onEdit,
  onDelete,
  onReport,
}: Props) {
  const { user } = useClientAuthProfile();
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    await navigator.share?.({
      url: window.location.href,
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xl"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={handleShare}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Share activity
          </button>

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
                  const ok = confirm(
                    "Delete this activity permanently?"
                  );
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