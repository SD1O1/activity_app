"use client";

import { useCallback, useEffect, useState } from "react";

type LogEvent = {
  id: string;
  level: "info" | "warn" | "error";
  event: string;
  context: Record<string, unknown> | null;
  occurred_at: string;
};

type LogsApiResponse = {
  success: boolean;
  data?: { events: LogEvent[] };
  error?: string;
};

const LEVELS = ["all", "error", "warn", "info"] as const;

export default function AdminLogsPage() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ limit: "200" });
    if (level !== "all") q.set("level", level);

    const res = await fetch(`/api/admin/log-events?${q.toString()}`, {
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => ({}))) as LogsApiResponse;
    if (!res.ok || !payload.success) {
      setError(payload.error ?? "Failed to load events");
      setLoading(false);
      return;
    }

    setEvents(payload.data?.events ?? []);
    setLoading(false);
  }, [level]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin • Error Monitoring</h1>

        <div className="flex flex-wrap gap-2">
          {LEVELS.map((option) => (
            <button
              key={option}
              onClick={() => setLevel(option)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                option === level
                  ? "border-orange-300 bg-orange-100 text-orange-800"
                  : "border-orange-200 bg-orange-50 text-slate-700 hover:bg-orange-100"
              }`}
            >
              {option}
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
            Loading log events…
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white px-4 py-6 text-sm text-slate-600">
            No log events found.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    {event.level}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(event.occurred_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{event.event}</p>
                {event.context ? (
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900/95 p-3 text-xs text-slate-100">
                    {JSON.stringify(event.context, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

