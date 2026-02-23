import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { parseJsonBody, uuidSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  conversationId: uuidSchema,
  seenAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, bodySchema);
  if ("error" in parsed) return parsed.error;

  const { conversationId, seenAt } = parsed.data;

  let parsedSeenAt: string;
  if (seenAt) {
    parsedSeenAt = new Date(seenAt).toISOString();
  } else {
    parsedSeenAt = new Date().toISOString();
  }

  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const auth = await requireApiUser(supabase);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;

  const rateLimitResponse = enforceRateLimit({
    routeKey: "chat-seen",
    userId: user.id,
    request: req,
    limit: 90,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { data: convo, error: convoError } = await admin
    .from("conversations")
    .select("id, activity_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError || !convo) {
    return errorResponse("Conversation not found", 404, "NOT_FOUND");
  }

  const { data: membership, error: membershipError } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    logger.error("chat_seen.membership_check_failed", {
      conversationId,
      userId: user.id,
      membershipError,
    });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }

  if (!membership) {
    const { data: isActivityMember, error: activityMemberError } = await admin
      .from("activity_members")
      .select("user_id")
      .eq("activity_id", convo.activity_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activityMemberError) {
      logger.error("chat_seen.activity_member_check_failed", {
        conversationId,
        activityId: convo.activity_id,
        userId: user.id,
        activityMemberError,
      });
      return errorResponse("Internal server error", 500, "INTERNAL");
    }

    if (!isActivityMember) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const { error: participantUpsertError } = await admin
      .from("conversation_participants")
      .upsert(
        {
          conversation_id: conversationId,
          user_id: user.id,
        },
        {
          onConflict: "conversation_id,user_id",
          ignoreDuplicates: true,
        }
      );

    if (participantUpsertError) {
      logger.error("chat_seen.participant_backfill_failed", {
        conversationId,
        userId: user.id,
        participantUpsertError,
      });
      return errorResponse("Internal server error", 500, "INTERNAL");
    }
  }

  const { error: updateError } = await admin
    .from("conversation_participants")
    .update({ last_seen_at: parsedSeenAt })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("chat_seen.update_failed", {
      conversationId,
      userId: user.id,
      updateError,
    });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }

  return successResponse({ seenAt: parsedSeenAt });
}