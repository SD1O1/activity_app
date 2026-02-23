import { errorResponse, successResponse } from "@/lib/apiResponses";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";

const MAX_MESSAGE_AGE_SECONDS = 20;
const DUPLICATE_NOTIFICATION_WINDOW_SECONDS = 15;

const toWindowBucket = (date: Date) =>
  Math.floor(date.getTime() / (DUPLICATE_NOTIFICATION_WINDOW_SECONDS * 1000));

const isMissingDedupeSetupError = (error: { message?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("dedupe_key") ||
    message.includes("no unique") ||
    message.includes("on conflict")
  );
};

export async function POST(req: Request) {
  const { conversationId, activityId, messageCreatedAt } = await req.json();

  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const auth = await requireApiUser(supabase);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;

  if (!conversationId) {
    return errorResponse("Invalid payload", 400);
  }

  let messageTimestamp = new Date();

  if (messageCreatedAt) {
    const createdAtDate = new Date(messageCreatedAt);

    if (!Number.isFinite(createdAtDate.getTime())) {
      return errorResponse("Invalid messageCreatedAt", 400);
    }

    const ageSeconds = (Date.now() - createdAtDate.getTime()) / 1000;
    if (ageSeconds > MAX_MESSAGE_AGE_SECONDS) {
      return successResponse({ skipped: "message_too_old" });
    }

    messageTimestamp = createdAtDate;
  }

  const { data: convo, error: convoError } = await admin
    .from("conversations")
    .select("activity_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError || !convo) {
    return errorResponse("Conversation not found", 404);
  }

  if (activityId && convo.activity_id !== activityId) {
    console.warn("chat notification activity mismatch", {
      conversationId,
      requestedActivityId: activityId,
      conversationActivityId: convo.activity_id,
      userId: user.id,
    });
  }

  const [
    { data: activity, error: activityError },
    { data: participantRecords, error: participantQueryError },
    { data: activityMembers, error: activityMembersError },
  ] = await Promise.all([
    admin
      .from("activities")
      .select("host_id")
      .eq("id", convo.activity_id)
      .maybeSingle(),
    admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId),
    admin
      .from("activity_members")
      .select("user_id")
      .eq("activity_id", convo.activity_id)
      .eq("status", "active"),
  ]);

  if (activityError || !activity) {
    console.error("chat notification activity lookup failed", {
      conversationId,
      activityId: convo.activity_id,
      userId: user.id,
      activityError,
    });
    return errorResponse("Internal server error", 500);
  }

  if (participantQueryError) {
    console.error("chat notification participant lookup failed", {
      conversationId,
      userId: user.id,
      participantQueryError,
    });
    return errorResponse("Internal server error", 500);
  }

  const participantIds = new Set(
    (participantRecords ?? []).map((participant) => participant.user_id)
  );

  if (activityMembersError) {
    console.error("chat notification activity members query failed", {
      conversationId,
      activityId: convo.activity_id,
      userId: user.id,
      activityMembersError,
    });
    return errorResponse("Internal server error", 500);
  }

  const activeMemberIds = new Set(
    (activityMembers ?? []).map((member) => member.user_id)
  );
  activeMemberIds.add(activity.host_id);

  const isConversationParticipant = participantIds.has(user.id);
  const isActivityMember = activeMemberIds.has(user.id);

  if (!isConversationParticipant && !isActivityMember) {
    return errorResponse("Forbidden", 403);
  }

  const participantRows = Array.from(activeMemberIds).map((memberId) => ({
    conversation_id: conversationId,
    user_id: memberId,
  }));

  const { error: participantUpsertError } = await admin
    .from("conversation_participants")
    .upsert(participantRows, {
      onConflict: "conversation_id,user_id",
      ignoreDuplicates: true,
    });

  if (participantUpsertError) {
    console.error("chat notification participant sync failed", {
      conversationId,
      userId: user.id,
      participantUpsertError,
    });
    return errorResponse("Internal server error", 500);
  }

  const recipientIds = new Set([...participantIds, ...activeMemberIds]);
  recipientIds.delete(user.id);

  const dedupeWindow = toWindowBucket(messageTimestamp);
  const rows = Array.from(recipientIds)
  .map((recipientId) => ({
    user_id: recipientId,
    actor_id: user.id,
    type: "chat",
    message: "sent you a message",
    activity_id: convo.activity_id,
    dedupe_key: `chat:${conversationId}:${user.id}:${recipientId}:${dedupeWindow}`,
  }));

if (!rows.length) {
  return successResponse();
}

const { error: upsertError } = await admin.from("notifications").upsert(rows, {
  onConflict: "user_id,type,dedupe_key",
  ignoreDuplicates: true,
});

if (upsertError) {
  if (!isMissingDedupeSetupError(upsertError)) {
    console.error("chat notification upsert failed", {
      conversationId,
      userId: user.id,
      upsertError,
    });
    return errorResponse("Internal server error", 500);
  }

  const rowsWithoutDedupeKey = rows.map((row) => {
    const { dedupe_key: omittedDedupeKey, ...rest } = row;
    void omittedDedupeKey;
    return rest;
  });
  const { error: insertError } = await admin
    .from("notifications")
    .insert(rowsWithoutDedupeKey);

  if (insertError) {
    console.error("chat notification fallback insert failed", {
      conversationId,
      userId: user.id,
      insertError,
    });
    return errorResponse("Internal server error", 500);
  }
}

return successResponse();
}