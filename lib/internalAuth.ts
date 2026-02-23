import { env } from "@/lib/env";

export function isInternalServerRequest(request: Request) {
  const key = request.headers.get("x-internal-api-key");
  return !!key && key === env.SUPABASE_SERVICE_ROLE_KEY;
}