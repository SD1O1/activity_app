"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type VerificationStatus = "pending" | "approved" | "rejected";

type VerificationItem = {
  id: string;
  verificationStatus: VerificationStatus;
  verificationVideoPath: string | null;
  verificationVideoUrl: string | null;
  phoneVerified: boolean;
  profile: {
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    verified: boolean;
  };
};

type ApiResponse = {
  success: boolean;
  data?: {
    verifications: VerificationItem[];
  };
  error?: string;
};

const STATUS_FILTERS: Array<{ label: string; value: "pending" | "approved" | "rejected" | "all" }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (statusFilter !== "all") {
      query.set("status", statusFilter);
    }

    const res = await fetch(`/api/admin/verifications?${query.toString()}`, {
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => ({}))) as ApiResponse;

    if (!res.ok || !payload.success) {
      setError(payload.error ?? "Failed to load verification queue");
      setLoading(false);
      return;
    }

    setItems(payload.data?.verifications ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueue();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadQueue]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.verificationStatus === "pending").length,
    [items]
  );

  const updateVerification = async (id: string, action: "approve" | "reject") => {
    setUpdatingId(id);
    setError(null);

    const res = await fetch(`/api/admin/verifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: {
        verificationStatus: VerificationStatus;
        verified: boolean;
      };
      error?: string;
    };

    if (!res.ok || !payload.success) {
      setError(payload.error ?? "Failed to update verification");
      setUpdatingId(null);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          verificationStatus: payload.data?.verificationStatus ?? item.verificationStatus,
          profile: {
            ...item.profile,
            verified: payload.data?.verified ?? item.profile.verified,
          },
        };
      })
    );

    setUpdatingId(null);
  };

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin • Profile Verification Queue</h1>
        <p className="text-sm text-slate-600">
          Manually review submitted verification videos. Pending in current view:{" "}
          <span className="font-semibold text-slate-900">{pendingCount}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                option.value === statusFilter
                  ? "border-orange-300 bg-orange-100 text-orange-800"
                  : "border-orange-200 bg-orange-50 text-slate-700 hover:bg-orange-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-orange-100 bg-white px-4 py-6 text-sm text-slate-600">
            Loading verification queue…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white px-4 py-6 text-sm text-slate-600">
            No profiles found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const displayName = item.profile.name?.trim() || item.profile.username || "User";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full border border-orange-100 bg-orange-50">
                        {item.profile.avatarUrl ? (
                          <Image
                            src={item.profile.avatarUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-500">
                          @{item.profile.username ?? "unknown"} • {item.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        verification: {item.verificationStatus}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        profile verified: {item.profile.verified ? "yes" : "no"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/35 p-3">
                    {item.verificationVideoUrl ? (
                      <video
                        controls
                        preload="metadata"
                        src={item.verificationVideoUrl}
                        className="w-full rounded-lg border border-orange-100"
                      />
                    ) : (
                      <p className="text-sm text-slate-600">
                        Unable to render preview. Stored path: {item.verificationVideoPath ?? "none"}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateVerification(item.id, "approve")}
                      disabled={updatingId === item.id}
                      className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-200 disabled:opacity-60"
                    >
                      Approve profile
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVerification(item.id, "reject")}
                      disabled={updatingId === item.id}
                      className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 transition-colors hover:bg-red-200 disabled:opacity-60"
                    >
                      Reject profile
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
