import { z } from "zod";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { parseJsonBody, uuidSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

type ApproveJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  approvedUserId?: string;
  joinMessage?: string | null;
};

const bodySchema = z
  .object({
    joinRequestId: uuidSchema.optional(),
    join_request_id: uuidSchema.optional(),
    activityId: uuidSchema.optional(),
    id: uuidSchema.optional(),
    participantId: uuidSchema.optional(),
    userId: uuidSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const joinRequestId = value.joinRequestId ?? value.join_request_id;
    const activityId = value.activityId ?? value.id;
    const participantId = value.participantId ?? value.userId;
    if (!joinRequestId && (!activityId || !participantId)) {
      ctx.addIssue({ code: "custom", message: "Missing required fields" });
    }
  });

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, bodySchema);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;
    let resolvedJoinRequestId = body.joinRequestId ?? body.join_request_id;
    let resolvedActivityId = body.activityId ?? body.id;
    let resolvedParticipantId = body.participantId ?? body.userId;

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = enforceRateLimit({
      routeKey: "approve-join",
      userId: user.id,
      request,
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (!resolvedJoinRequestId) {
      const { data: joinRequest, error: joinRequestLookupError } = await supabase
        .from("join_requests")
        .select("id")
        .eq("activity_id", resolvedActivityId)
        .eq("requester_id", resolvedParticipantId)
        .eq("status", "pending")
        .maybeSingle();

      if (joinRequestLookupError) {
        logger.error("approve_join.lookup_failed", {
          joinRequestLookupError,
          activityId: resolvedActivityId,
          participantId: resolvedParticipantId,
          userId: user.id,
        });
        return errorResponse("Failed to find join request", 500, "INTERNAL");
      }

      if (!joinRequest?.id) {
        return errorResponse("Pending join request not found", 400, "BAD_REQUEST");
      }

      resolvedJoinRequestId = joinRequest.id;
    }

    if (!resolvedActivityId || !resolvedParticipantId) {
      const { data: joinRequestMeta } = await admin
        .from("join_requests")
        .select("activity_id, requester_id")
        .eq("id", resolvedJoinRequestId)
        .maybeSingle();

      if (joinRequestMeta) {
        resolvedActivityId = resolvedActivityId ?? joinRequestMeta.activity_id;
        resolvedParticipantId = resolvedParticipantId ?? joinRequestMeta.requester_id;
      }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "approve_join_request_atomic",
      {
        p_join_request_id: resolvedJoinRequestId,
      }
    );

    if (rpcError) {
      logger.error("approve_join.rpc_failed", {
        joinRequestId: resolvedJoinRequestId,
        userId: user.id,
        rpcError,
      });
      return errorResponse("Failed to approve join request", 500, "RPC_ERROR");
    }

    const result = (rpcResult ?? {}) as ApproveJoinRpcResult;

    if (result.ok) {
      const approvedUserId = result.approvedUserId ?? resolvedParticipantId;

      if (approvedUserId && resolvedActivityId) {
        const { data: conversation } = await admin
          .from("conversations")
          .select("id")
          .eq("activity_id", resolvedActivityId)
          .maybeSingle();

        if (conversation?.id) {
          await admin.from("conversation_participants").upsert(
            {
              conversation_id: conversation.id,
              user_id: approvedUserId,
            },
            {
              onConflict: "conversation_id,user_id",
              ignoreDuplicates: true,
            }
          );
        }
      }

      return successResponse(
        {
          ok: true,
          code: result.code || "OK",
          message: result.message || "Join request approved",
          approvedUserId: result.approvedUserId,
          joinMessage: result.joinMessage ?? null,
        },
        200
      );
    }

    const statusMap: Record<string, number> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      BAD_REQUEST: 400,
      CONFLICT: 409,
    };

    const status = statusMap[result.code] ?? 500;
    return errorResponse(
      result.message || "Failed to approve join request",
      status,
      result.code || "INTERNAL"
    );
  } catch (error) {
    logger.error("approve_join.unhandled", { error });
    return errorResponse("Malformed request body", 400, "BAD_REQUEST");
  }
}