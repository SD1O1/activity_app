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

    if (!user) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!isAdminUserId(user.id)) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const rateLimitResponse = await enforceRateLimit({
      routeKey: "admin-reports",
      userId: user.id,
      request: req,
      limit: 30,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const admin = createSupabaseAdmin();
    const { data: reports, error } = await admin
      .from("reports")
      .select(
        "id, reporter_id, target_type, target_id, reason, details, created_at, status, review_note, reviewed_at, reviewed_by"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("admin_reports.fetch_failed", { error, userId: user.id });
      return errorResponse("Failed to fetch reports", 500, "INTERNAL");
    }

    return successResponse({ reports: reports ?? [] });
  } catch (error) {
    logger.error("admin_reports.unhandled", { error });
    return errorResponse("Failed to fetch reports", 500, "INTERNAL");
  }
}

