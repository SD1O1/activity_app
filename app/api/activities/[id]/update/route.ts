import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { parseJsonBody, uuidSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

const activityTypeSchema = z.enum(["group", "one-on-one"]).optional();

const bodySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(5000).optional(),
  type: activityTypeSchema,
  max_members: z.number().int().positive().optional(),
  cost_rule: z.string().max(1000).optional(),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: activityId } = await context.params;
  if (!uuidSchema.safeParse(activityId).success) {
    return errorResponse("Invalid activityId", 400, "BAD_REQUEST");
  }

  const parsed = await parseJsonBody(req, bodySchema);
  if ("error" in parsed) return parsed.error;

  const { title, description, type, max_members, cost_rule } = parsed.data;

  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { data: activity, error: fetchError } = await admin
    .from("activities")
    .select("id, host_id, member_count")
    .eq("id", activityId)
    .neq("status", "deleted")
    .single();

  if (fetchError || !activity) {
    return errorResponse("Activity not found", 404, "NOT_FOUND");
  }

  if (activity.host_id !== user.id) {
    return errorResponse("Forbidden", 403, "FORBIDDEN");
  }

  if (typeof max_members === "number" && max_members < activity.member_count) {
    return errorResponse("max_members cannot be less than current member_count", 409, "CONFLICT");
  }

  const { error: updateError } = await admin
    .from("activities")
    .update({
      title,
      description,
      type,
      cost_rule,
      max_members,
    })
    .eq("id", activityId);

  if (updateError) {
    logger.error("activity.update_failed", {
      activityId,
      userId: user.id,
      updateError,
    });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }

  return successResponse(undefined, 200);
}