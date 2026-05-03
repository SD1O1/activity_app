import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { isAdminUserId } from "@/lib/adminAuth";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    if (!isAdminUserId(user.id)) return errorResponse("Forbidden", 403, "FORBIDDEN");

    const rateLimitResponse = await enforceRateLimit({
      routeKey: "admin-log-events",
      userId: user.id,
      request: req,
      limit: 30,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 100);
    const level = url.searchParams.get("level");

    const admin = createSupabaseAdmin();
    let query = admin
      .from("log_events")
      .select("id, level, event, context, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (level === "info" || level === "warn" || level === "error") {
      query = query.eq("level", level);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("admin_log_events.fetch_failed", { error, userId: user.id });
      return errorResponse("Failed to fetch log events", 500, "INTERNAL");
    }

    return successResponse({ events: data ?? [] });
  } catch (error) {
    logger.error("admin_log_events.unhandled", { error });
    return errorResponse("Failed to fetch log events", 500, "INTERNAL");
  }
}

