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
    const { id } = await context.params;
    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = await enforceRateLimit({
      routeKey: "complete-activity",
      userId: user.id,
      request: _req,
      limit: 10,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("host_id")
      .eq("id", id)
      .neq("status", "deleted")
      .single();

    if (activityError) {
      return errorResponse("Failed to load activity", 500, "INTERNAL");
    }

    if (!activity || activity.host_id !== user.id) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const { error: updateError } = await admin
      .from("activities")
      .update({ status: "completed" })
      .eq("id", id);

    if (updateError) {
      return errorResponse("Failed to complete activity", 500, "INTERNAL");
    }

    return successResponse();
  } catch (error) {
    console.error("complete activity error", { error });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}
