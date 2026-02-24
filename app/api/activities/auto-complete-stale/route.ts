import { errorResponse, successResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin } from "@/lib/supabaseServer";
import { isInternalServerRequest, isScheduledServerRequest } from "@/lib/internalAuth";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const isInternal = isInternalServerRequest(req);
    const isScheduled = isScheduledServerRequest(req);

    if (!isInternal && !isScheduled) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const admin = createSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { data, error } = await admin
      .from("activities")
      .update({ status: "completed" })
      .in("status", ["open", "full"])
      .lt("starts_at", nowIso)
      .select("id");

    if (error) {
      return errorResponse("Failed to complete stale activities", 500, "INTERNAL");
    }

    return successResponse({ updatedCount: data?.length ?? 0 });
  } catch (error) {
    logger.error("activity.auto_complete_stale.unhandled", { error });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}