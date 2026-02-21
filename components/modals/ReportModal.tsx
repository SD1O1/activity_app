"use client";

import { useState } from "react";
import { createReport } from "@/lib/reporting";
import { useToast } from "@/components/ui/ToastProvider";

type ReportTargetType = "profile" | "activity";

type Props = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
};

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  reporterId,
}: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await createReport({
        reporterId,
        targetType,
        targetId,
        reason: reason || null,
        message: details.trim() || null,
      });

      showToast("Report submitted", "success");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full rounded-t-2xl bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold">Report</h2>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full rounded-lg border p-2 text-sm"
        />

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe the issue (optional)"
          className="w-full rounded-lg border p-2 text-sm"
          rows={4}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-black py-3 text-sm text-white"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}