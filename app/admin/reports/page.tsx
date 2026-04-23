"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ReportItem = {
  id: string;
  reporter_id: string;
  target_type: "profile" | "activity";
  target_id: string;
  reason: string | null;
  details: string | null;
  created_at: string;
  status?: "open" | "under_review" | "resolved" | "dismissed";
  review_note?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

type ApiResponse = {
  success: boolean;
  data?: { reports: ReportItem[] };
  error?: string;
};

const STATUS_OPTIONS = ["open", "under_review", "resolved", "dismissed"] as const;

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/reports", { cache: "no-store" });
    const payload = (await res.json().catch(() => ({}))) as ApiResponse;

    if (!res.ok || !payload.success) {
      setError(payload.error ?? "Failed to load reports");
      setLoading(false);
      return;
    }

    const nextReports = payload.data?.reports ?? [];
    setReports(nextReports);
    setReviewNotes(
      Object.fromEntries(nextReports.map((r) => [r.id, r.review_note ?? ""]))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReports]);

  const pendingCount = useMemo(
    () => reports.filter((r) => (r.status ?? "open") === "open").length,
    [reports]
  );

  const updateStatus = async (report: ReportItem, status: (typeof STATUS_OPTIONS)[number]) => {
    setUpdatingId(report.id);
    setError(null);
    const reviewNote = reviewNotes[report.id]?.trim() || null;

    const res = await fetch(`/api/admin/reports/${report.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!res.ok || !payload.success) {
      setError(payload.error ?? "Failed to update report");
      setUpdatingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((item) =>
        item.id === report.id
          ? {
              ...item,
              status,
              review_note: reviewNote,
              reviewed_at: new Date().toISOString(),
            }
          : item
      )
    );
    setUpdatingId(null);
  };

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin • Report Triage</h1>
        <p className="text-sm text-slate-600">
          Review and triage user reports. Open reports:{" "}
          <span className="font-semibold text-slate-900">{pendingCount}</span>
        </p>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-orange-100 bg-white px-4 py-6 text-sm text-slate-600">
            Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white px-4 py-6 text-sm text-slate-600">
            No reports found.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {report.target_type} • {report.target_id}
                  </p>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    {report.status ?? "open"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Reason:</span>{" "}
                  {report.reason?.trim() || "No reason provided"}
                </p>
                {report.details ? (
                  <p className="mt-1 text-sm text-slate-600">{report.details}</p>
                ) : null}

                <p className="mt-2 text-xs text-slate-500">
                  Reporter: {report.reporter_id} • Created:{" "}
                  {new Date(report.created_at).toLocaleString()}
                </p>

                <textarea
                  className="mt-3 w-full rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none"
                  rows={2}
                  placeholder="Add moderator note (optional)"
                  value={reviewNotes[report.id] ?? ""}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                  }
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === report.id}
                      onClick={() => updateStatus(report, status)}
                      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-100 disabled:opacity-60"
                    >
                      Mark {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
