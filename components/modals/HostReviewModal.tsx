"use client";

type HostReviewModalProps = {
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
  };
  

export default function HostReviewModal({
  open,
  onClose,
  onAccept,
}: HostReviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Review Join Request
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        {/* Requester info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
            R
          </div>
          <div>
            <p className="text-sm font-medium">Rahul, 27</p>
            <p className="text-xs text-gray-500">Verified profile</p>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium">
              Why do you want to join?
            </p>
            <p className="text-gray-600">
              Looking to meet new people and have good conversations.
            </p>
          </div>

          <div>
            <p className="font-medium">
              What kind of conversation do you enjoy?
            </p>
            <p className="text-gray-600">
              Startups, life experiences, and ideas.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button className="w-full rounded-xl border py-3 text-sm font-medium">
            Decline
          </button>
          <button 
            onClick={onAccept}
            className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
            >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}