import { errorResponse, successResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { uuidSchema } from "@/lib/validation";
import { isInternalServerRequest } from "@/lib/internalAuth";
import { logger } from "@/lib/logger";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!uuidSchema.safeParse(id).success) {
      return errorResponse("Invalid activityId", 400, "BAD_REQUEST");
    }

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const internalCall = isInternalServerRequest(req);
    let callerUserId: string | null = null;

    if (!internalCall) {
      const auth = await requireApiUser(supabase);
      if ("response" in auth) {
        return auth.response;
      }
      callerUserId = auth.user.id;
    }

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("host_id, starts_at, status")
      .eq("id", id)
      .neq("status", "deleted")
      .single();

    if (activityError) {
      return errorResponse("Failed to load activity", 500, "INTERNAL");
    }

    if (!activity) {
      return errorResponse("Activity not found", 404, "NOT_FOUND");
    }

    if (!internalCall && callerUserId !== activity.host_id) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const now = new Date();
    const startsAt = new Date(activity.starts_at);

    if (startsAt < now && activity.status !== "completed") {
      const { error: updateError } = await admin
        .from("activities")
        .update({ status: "completed" })
        .eq("id", id);

      if (updateError) {
        return errorResponse("Failed to complete activity", 500, "INTERNAL");
      }
    }

    return successResponse();
  } catch (error) {
    logger.error("activity.auto_complete.unhandled", { error });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}