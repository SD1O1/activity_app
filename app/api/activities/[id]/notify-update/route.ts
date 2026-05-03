import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { errorResponse, successResponse } from "@/lib/apiResponses";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activityId } = await context.params;
    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = await enforceRateLimit({
      routeKey: "notify-update",
      userId: user.id,
      request: _req,
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("host_id, title")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return errorResponse("Activity not found", 404, "NOT_FOUND");
    }

    if (activity.host_id !== user.id) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const { data: members, error: membersError } = await admin
      .from("activity_members")
      .select("user_id")
      .eq("activity_id", activityId)
      .neq("user_id", activity.host_id);

    if (membersError || !members) {
      return errorResponse("Failed to load members", 500, "INTERNAL");
    }

    if (members.length === 0) {
      return successResponse();
    }

    const notifications = members.map((m) => ({
      user_id: m.user_id,
      actor_id: user.id,
      type: "activity_updated",
      message: `Activity "${activity.title}" has been updated`,
      activity_id: activityId,
    }));

    const { error: notifyError } = await admin
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      console.error("notify update failed", {
        activityId,
        userId: user.id,
        notifyError,
      });
      return errorResponse("Failed to notify participants", 500, "INTERNAL");
    }

    return successResponse();
  } catch (error) {
    console.error("notify-update error", { error });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}