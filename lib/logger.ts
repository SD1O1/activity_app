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

function write(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    event,
    ...(context ? { context: sanitize(context) } : {}),
    timestamp: new Date().toISOString(),
  };

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