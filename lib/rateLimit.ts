import { errorResponse } from "@/lib/apiResponses";

type RateLimitOptions = {
  routeKey: string;
  userId: string;
  request: Request;
  limit: number;
  windowMs: number;
};

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const now = () => Date.now();

const getIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
};

function checkAndIncrement(key: string, limit: number, windowMs: number) {
  const current = store.get(key);
  const ts = now();

  if (!current || current.resetAt <= ts) {
    store.set(key, { count: 1, resetAt: ts + windowMs });
    return false;
  }

  if (current.count >= limit) {
    return true;
  }

  current.count += 1;
  return false;
}

export function enforceRateLimit(options: RateLimitOptions) {
  const ip = getIp(options.request);
  const userLimited = checkAndIncrement(
    `${options.routeKey}:user:${options.userId}`,
    options.limit,
    options.windowMs
  );
  const ipLimited = checkAndIncrement(
    `${options.routeKey}:ip:${ip}`,
    options.limit,
    options.windowMs
  );

  if (userLimited || ipLimited) {
    return errorResponse("Too many requests", 429, "RATE_LIMITED");
  }

  return null;
}