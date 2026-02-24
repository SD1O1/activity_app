import { env } from "@/lib/env";

export function isInternalServerRequest(request: Request) {
  const key = request.headers.get("x-internal-api-key");
  return !!key && key === env.INTERNAL_API_SECRET;
}

export function isScheduledServerRequest(request: Request) {
  return request.headers.get("x-vercel-cron") === "1";
}