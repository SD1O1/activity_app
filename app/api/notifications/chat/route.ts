import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!conversationId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let messageTimestamp = new Date();

  if (messageCreatedAt) {
    const createdAtDate = new Date(messageCreatedAt);

    if (!Number.isFinite(createdAtDate.getTime())) {
      return NextResponse.json({ error: "Invalid messageCreatedAt" }, { status: 400 });
    }

    const ageSeconds = (Date.now() - createdAtDate.getTime()) / 1000;
    if (ageSeconds > MAX_MESSAGE_AGE_SECONDS) {
      return NextResponse.json({ success: true, skipped: "message_too_old" });
    }

    messageTimestamp = createdAtDate;
  }

  const { data: convo, error: convoError } = await admin
    .from("conversations")
    .select("activity_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError || !convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (activityId && convo.activity_id !== activityId) {
    console.warn("chat notification activity mismatch", {
      conversationId,
      requestedActivityId: activityId,
      conversationActivityId: convo.activity_id,
      userId: user.id,
    });
  }

  const { data: activity, error: activityError } = await admin
    .from("activities")
    .select("host_id")
    .eq("id", convo.activity_id)
    .maybeSingle();

  if (activityError || !activity) {
    console.error("chat notification activity lookup failed", {
      conversationId,
      activityId: convo.activity_id,
      userId: user.id,
      activityError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: participantRecords, error: participantQueryError } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  if (participantQueryError) {
    console.error("chat notification participant lookup failed", {
      conversationId,
      userId: user.id,
      participantQueryError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const participantIds = new Set(
    (participantRecords ?? []).map((participant) => participant.user_id)
  );

  const { data: activityMembers, error: activityMembersError } = await admin
    .from("activity_members")
    .select("user_id")
    .eq("activity_id", convo.activity_id)
    .eq("status", "active");

  if (activityMembersError) {
    console.error("chat notification activity members query failed", {
      conversationId,
      activityId: convo.activity_id,
      userId: user.id,
      activityMembersError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const activeMemberIds = new Set(
    (activityMembers ?? []).map((member) => member.user_id)
  );
  activeMemberIds.add(activity.host_id);

  const isConversationParticipant = participantIds.has(user.id);
  const isActivityMember = activeMemberIds.has(user.id);

  if (!isConversationParticipant && !isActivityMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const recipientIds = new Set([...participantIds, ...activeMemberIds]);
  recipientIds.delete(user.id);

  const rows = Array.from(recipientIds)
  .map((recipientId) => ({
    user_id: recipientId,
    actor_id: user.id,
    type: "chat",
    message: "sent you a message",
    activity_id: convo.activity_id,
    dedupe_key: `chat:${conversationId}:${user.id}:${recipientId}:${toWindowBucket(messageTimestamp)}`,
  }));

if (!rows.length) {
  return NextResponse.json({ success: true });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

return NextResponse.json({ success: true });
}