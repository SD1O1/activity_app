import { env } from "@/lib/env";

export function isInternalServerRequest(request: Request) {
  const key = request.headers.get("x-internal-api-key");
  return !!key && key === env.INTERNAL_API_SECRET;
}

export function isScheduledServerRequest(request: Request) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const authHeader = request.headers.get("authorization");
  const expectedAuthHeader = `Bearer ${env.CRON_SECRET}`;

  return isVercelCron && authHeader === expectedAuthHeader;
}