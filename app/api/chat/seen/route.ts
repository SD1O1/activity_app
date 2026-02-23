import { errorResponse, successResponse } from "@/lib/apiResponses";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";

export async function POST(req: Request) {
  const { conversationId, seenAt } = await req.json();

  if (!conversationId) {
    return errorResponse("Invalid payload", 400);
  }

  let parsedSeenAt: string;
  if (seenAt) {
    const seenDate = new Date(seenAt);
    if (!Number.isFinite(seenDate.getTime())) {
      return errorResponse("Invalid seenAt", 400);
    }
    parsedSeenAt = seenDate.toISOString();
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

  const { data: convo, error: convoError } = await admin
    .from("conversations")
    .select("id, activity_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError || !convo) {
    return errorResponse("Conversation not found", 404);
  }

  const { data: membership, error: membershipError } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("chat seen membership check failed", {
      conversationId,
      userId: user.id,
      membershipError,
    });
    return errorResponse("Internal server error", 500);
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
      console.error("chat seen activity member check failed", {
        conversationId,
        activityId: convo.activity_id,
        userId: user.id,
        activityMemberError,
      });
      return errorResponse("Internal server error", 500);
    }

    if (!isActivityMember) {
      return errorResponse("Forbidden", 403);
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
      console.error("chat seen participant backfill failed", {
        conversationId,
        userId: user.id,
        participantUpsertError,
      });
      return errorResponse("Internal server error", 500);
    }
  }

  const { error: updateError } = await admin
    .from("conversation_participants")
    .update({ last_seen_at: parsedSeenAt })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("chat seen update failed", {
      conversationId,
      userId: user.id,
      updateError,
    });
    return errorResponse("Internal server error", 500);
  }

  return successResponse({ seenAt: parsedSeenAt });
}