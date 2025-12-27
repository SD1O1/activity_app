"use client";

import { supabase } from "@/lib/supabaseClient";

type JoinRequestModalProps = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  hostId: string;
  onSuccess: () => Promise<void>;
};

export default function JoinRequestModal({
  open,
  onClose,
  activityId,
  hostId,
  onSuccess,
}: JoinRequestModalProps) {
  if (!open) return null;

  const handleSubmit = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    // 🔒 FRONT-END GUARD (prevents multiple requests)
    const { data: existing } = await supabase
      .from("join_requests")
      .select("id")
      .eq("activity_id", activityId)
      .eq("requester_id", auth.user.id)
      .maybeSingle();

    if (existing) return;

    // ✅ Create join request
    await supabase.from("join_requests").insert({
      activity_id: activityId,
      requester_id: auth.user.id,
      status: "pending",
    });

    // 🔔 Notify host
    await supabase.from("notifications").insert({
      user_id: hostId,
      type: "join_request",
      message: "New join request for your activity",
      activity_id: activityId,
    });

    // 🔥 THIS IS THE IMPORTANT PART
    await onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Request to Join</h2>
          <button onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            className="w-full rounded-lg border p-2 text-sm"
            rows={3}
            placeholder="Why do you want to join?"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}