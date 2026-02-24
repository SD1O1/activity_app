import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/apiResponses";
import { requireApiUser } from "@/lib/apiAuth";
import { insertNotification } from "@/lib/notifications";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { parseJsonBody, uuidSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

type RemoveMemberRpcResult = {
  ok: boolean;
  code: string;
  message: string;
};

const bodySchema = z.object({
  activityId: uuidSchema,
  userId: uuidSchema,
});

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, bodySchema);
    if ("error" in parsed) return parsed.error;

    const { activityId, userId: targetUserId } = parsed.data;

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = enforceRateLimit({
      routeKey: "remove-member",
      userId: user.id,
      request: req,
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: activityForNotification } = await admin
      .from("activities")
      .select("id, host_id, title")
      .eq("id", activityId)
      .maybeSingle();

    const notifyHostForSelfLeave =
      !!activityForNotification &&
      targetUserId === user.id &&
      targetUserId !== activityForNotification.host_id;

    const sendHostLeaveNotification = async () => {
      if (!notifyHostForSelfLeave || !activityForNotification) return;

      const { data: actorProfile } = await admin
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .maybeSingle();

      const actorName = actorProfile?.name || actorProfile?.username || "A participant";

      const { error: notifyError } = await insertNotification(admin, {
        user_id: activityForNotification.host_id,
        actor_id: user.id,
        type: "member_left",
        message: `${actorName} has left '${activityForNotification.title}' activity`,
        activity_id: activityId,
      });

      if (notifyError) {
        logger.warn("remove_member.notify_host_failed", {
          activityId,
          actorId: user.id,
          notifyError,
        });
      }
    };

    const { data: rpcResult, error: rpcError } = await admin.rpc("remove_member_atomic", {
      p_activity_id: activityId,
      p_actor_id: user.id,
      p_target_user_id: targetUserId,
    });

    if (rpcError) {
      logger.warn("remove_member.rpc_failed_fallback", {
        activityId,
        actorId: user.id,
        targetUserId,
        rpcError,
      });

      const { data: activity, error: activityError } = await admin
        .from("activities")
        .select("id, host_id, status, member_count, max_members")
        .eq("id", activityId)
        .neq("status", "deleted")
        .maybeSingle();

      if (activityError) {
        return errorResponse("Failed to load activity", 500, "INTERNAL");
      }

      if (!activity) {
        return errorResponse("Activity not found", 404, "NOT_FOUND");
      }

      const isHost = activity.host_id === user.id;
      const isSelfRemoval = user.id === targetUserId;

      if (!isHost && !isSelfRemoval) {
        return errorResponse("Only the host can remove other participants", 403, "FORBIDDEN");
      }

      if (targetUserId === activity.host_id) {
        return errorResponse("Host cannot be removed from their own activity", 400, "BAD_REQUEST");
      }

      const { data: member, error: memberLookupError } = await admin
        .from("activity_members")
        .select("*")
        .eq("activity_id", activityId)
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .maybeSingle();

      if (memberLookupError) {
        return errorResponse("Failed to validate membership", 500, "INTERNAL");
      }

      if (!member?.id) {
        return errorResponse("Member not found", 404, "NOT_FOUND");
      }

      const { data: conversation } = await admin
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      let removedConversationParticipant: Record<string, any> | null = null;
      if (conversation?.id) {
        const { data: existingConversationParticipant } = await admin
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversation.id)
          .eq("user_id", targetUserId)
          .maybeSingle();

        removedConversationParticipant =
          (existingConversationParticipant as Record<string, any> | null) ?? null;
      }

      const rollbackMembership = async () => {
        const { error: rollbackMembershipError } = await admin
          .from("activity_members")
          .insert(member);

        if (rollbackMembershipError) {
          logger.error("remove_member.fallback_membership_rollback_failed", {
            activityId,
            actorId: user.id,
            targetUserId,
            rollbackMembershipError,
          });
        }
      };

      const rollbackConversationParticipant = async () => {
        if (!removedConversationParticipant) return;

        const { error: rollbackConversationParticipantError } = await admin
          .from("conversation_participants")
          .insert(removedConversationParticipant);

        if (rollbackConversationParticipantError) {
          logger.error("remove_member.fallback_conversation_participant_rollback_failed", {
            activityId,
            actorId: user.id,
            targetUserId,
            rollbackConversationParticipantError,
          });
        }
      };

      const { error: deleteMembershipError } = await admin
        .from("activity_members")
        .delete()
        .eq("id", member.id);

      if (deleteMembershipError) {
        return errorResponse("Failed to remove member", 500, "INTERNAL");
      }

      if (conversation?.id) {
        const { error: deleteConversationParticipantError } = await admin
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversation.id)
          .eq("user_id", targetUserId);

        if (deleteConversationParticipantError) {
          await rollbackMembership();
          return errorResponse("Failed to remove conversation participant", 500, "INTERNAL");
        }
      }

      const { count: activeMemberCount, error: memberCountError } = await admin
        .from("activity_members")
        .select("id", { count: "exact", head: true })
        .eq("activity_id", activityId)
        .eq("status", "active");

      if (memberCountError || activeMemberCount === null) {
        await rollbackConversationParticipant();
        await rollbackMembership();
        return errorResponse("Failed to recalculate member count", 500, "INTERNAL");
      }

      const nextStatus =
        activity.status === "full" && activeMemberCount < activity.max_members
          ? "open"
          : activity.status;

      const { error: updateActivityError } = await admin
        .from("activities")
        .update({
          member_count: activeMemberCount,
          status: nextStatus,
        })
        .eq("id", activityId);

      if (updateActivityError) {
        await rollbackConversationParticipant();
        await rollbackMembership();
        return errorResponse("Failed to update activity", 500, "INTERNAL");
      }

      await sendHostLeaveNotification();
      return successResponse({ mode: "fallback" });
    }

    const result = (rpcResult ?? {}) as RemoveMemberRpcResult;

    if (result.ok) {
      await sendHostLeaveNotification();
      return successResponse();
    }

    const statusMap: Record<string, number> = {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
    };

    return errorResponse(
      result.message || "Internal server error",
      statusMap[result.code] ?? 500,
      result.code || "INTERNAL"
    );
  } catch (err) {
    logger.error("remove_member.unhandled", { err });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}