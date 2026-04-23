import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { env } from "@/lib/env";

type LogLevel = "info" | "warn" | "error";

const sanitize = (value: unknown): unknown => {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      key.toLowerCase().includes("sql") ? "[redacted]" : sanitize(val),
    ])
  );
};

const LEVEL_SCORE: Record<LogLevel, number> = {
  info: 1,
  warn: 2,
  error: 3,
};

const minPersistLevel = (() => {
  const raw = env.LOG_EVENTS_MIN_LEVEL;
  if (raw === "info" || raw === "warn" || raw === "error") return raw;
  return "warn" as LogLevel;
})();

function shouldPersist(level: LogLevel) {
  const enabled = env.LOG_EVENTS_ENABLED === "1";
  return enabled && LEVEL_SCORE[level] >= LEVEL_SCORE[minPersistLevel];
}

function persistLogEvent(payload: {
  level: LogLevel;
  event: string;
  context?: Record<string, unknown>;
  timestamp: string;
}) {
  if (typeof window !== "undefined") return;
  if (!shouldPersist(payload.level)) return;

  const admin = createSupabaseAdmin();
  void admin.from("log_events").insert({
    level: payload.level,
    event: payload.event,
    context: payload.context ?? null,
    occurred_at: payload.timestamp,
  });
}

function write(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const sanitizedContext = context
    ? (sanitize(context) as Record<string, unknown>)
    : undefined;

  const payload = {
    level,
    event,
    ...(sanitizedContext ? { context: sanitizedContext } : {}),
    timestamp: new Date().toISOString(),
  };

  persistLogEvent(payload);

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) =>
    write("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) =>
    write("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) =>
    write("error", event, context),
};
