import { errorResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { logger } from "@/lib/logger";

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

async function checkDbRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.rpc("consume_rate_limit_atomic", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });

    if (error) {
      logger.warn("rate_limit.rpc_failed", {
        key,
        limit,
        windowMs,
        error,
      });
      return checkAndIncrement(key, limit, windowMs);
    }

    return Boolean(data);
  } catch (error) {
    logger.warn("rate_limit.rpc_exception", {
      key,
      limit,
      windowMs,
      error,
    });
    return checkAndIncrement(key, limit, windowMs);
  }
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const ip = getIp(options.request);
  const userLimited = await checkDbRateLimit(
    `${options.routeKey}:user:${options.userId}`,
    options.limit,
    options.windowMs
  );
  const ipLimited = await checkDbRateLimit(
    `${options.routeKey}:ip:${ip}`,
    options.limit,
    options.windowMs
  );

  if (userLimited || ipLimited) {
    return errorResponse("Too many requests", 429, "RATE_LIMITED");
  }

  return null;
}
