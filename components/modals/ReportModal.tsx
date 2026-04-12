"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-[2px]">
      <div className="w-full space-y-4 rounded-t-[2rem] border border-orange-100/80 bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] p-4 sm:mx-auto sm:mb-4 sm:max-w-xl sm:rounded-[1.75rem] sm:p-6 sm:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.6)]">
        <div className="flex justify-center pb-1">
          <div className="h-1.5 w-10 rounded-full bg-orange-200" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Report</h2>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        />

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe the issue (optional)"
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          rows={4}
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl border border-[#f97316] bg-[#f97316] py-3 text-sm font-semibold text-white shadow-[0_18px_30px_-20px_rgba(249,115,22,0.8)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        <button
          onClick={onClose}
          className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}