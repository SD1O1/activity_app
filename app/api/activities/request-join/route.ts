import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { parseJsonBody, uuidSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

type RequestJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  duplicatePending?: boolean;
};

const bodySchema = z.object({
  activityId: uuidSchema,
  answers: z.array(z.string()).optional(),
  message: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, bodySchema);
    if ("error" in parsed) return parsed.error;

    const activityId = parsed.data.activityId;
    const answers = (parsed.data.answers ?? [])
      .map((answer) => answer.trim())
      .filter((answer) => answer.length > 0);
    const message = parsed.data.message ?? parsed.data.note ?? null;

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = enforceRateLimit({
      routeKey: "request-join",
      userId: user.id,
      request: req,
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("id, host_id, status, starts_at, member_count, max_members")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return errorResponse("Activity not found", 404, "NOT_FOUND");
    }

    if (activity.host_id === user.id) {
      return errorResponse(
        "Hosts cannot request to join their own activity",
        400,
        "BAD_REQUEST"
      );
    }

    const hasStarted = new Date(activity.starts_at).getTime() < Date.now();

    if (activity.status === "completed" || hasStarted) {
      if (activity.status !== "completed" && hasStarted) {
        await admin
          .from("activities")
          .update({ status: "completed" })
          .eq("id", activityId)
          .in("status", ["open", "full"]);
      }

      return errorResponse("Activity has already ended", 409, "CONFLICT");
    }

    if (activity.member_count >= activity.max_members || activity.status === "full") {
      return errorResponse("Activity is full", 409, "CONFLICT");
    }

    const { data: membership, error: membershipError } = await admin
      .from("activity_members")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      logger.error("request_join.membership_check_failed", {
        activityId,
        requesterId: user.id,
        membershipError,
      });
      return errorResponse("Failed to validate membership status", 500, "INTERNAL");
    }

    if (membership) {
      return errorResponse("You are already a member of this activity", 409, "CONFLICT");
    }

    const { data: rpcResult, error: rpcError } = await admin.rpc("request_join_atomic", {
      p_activity_id: activityId,
      p_requester_id: user.id,
      p_message: message,
    });

    if (rpcError) {
      logger.error("request_join.rpc_failed", {
        activityId,
        requesterId: user.id,
        rpcError,
      });
      return errorResponse("Failed to create join request", 500, "RPC_ERROR");
    }

    const result = (rpcResult ?? {}) as RequestJoinRpcResult;

    if (result.ok) {
      if (answers.length > 0) {
        const { error: answersError } = await admin
          .from("join_requests")
          .update({ answers })
          .eq("activity_id", activityId)
          .eq("requester_id", user.id)
          .eq("status", "pending");

        if (answersError) {
          logger.warn("request_join.answers_update_failed", {
            activityId,
            requesterId: user.id,
            answersError,
          });
        }
      }

      return successResponse(
        {
          message: result.message || "Join request sent",
          duplicatePending: Boolean(result.duplicatePending),
        },
        200
      );
    }

    if (result.code === "BAD_REQUEST") {
      return errorResponse(result.message || "Invalid request", 400, "BAD_REQUEST");
    }

    if (result.code === "CONFLICT") {
      return errorResponse(result.message || "Conflict", 409, "CONFLICT");
    }

    return errorResponse(result.message || "Internal server error", 500, result.code || "INTERNAL");
  } catch (err) {
    logger.error("request_join.unhandled", { err });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}