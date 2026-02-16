import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

const MAX_MESSAGE_AGE_SECONDS = 20;
const DUPLICATE_NOTIFICATION_WINDOW_SECONDS = 15;

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

  if (messageCreatedAt) {
    const createdAtDate = new Date(messageCreatedAt);

    if (!Number.isFinite(createdAtDate.getTime())) {
      return NextResponse.json({ error: "Invalid messageCreatedAt" }, { status: 400 });
    }

    const ageSeconds = (Date.now() - createdAtDate.getTime()) / 1000;
    if (ageSeconds > MAX_MESSAGE_AGE_SECONDS) {
      return NextResponse.json({ success: true, skipped: "message_too_old" });
    }
  }

  const { data: callerMembership } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!callerMembership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (activityId) {
    const { data: convo } = await admin
      .from("conversations")
      .select("activity_id")
      .eq("id", conversationId)
      .single();

    if (!convo || convo.activity_id !== activityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: participants, error: participantsError } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id);

  if (participantsError) {
    console.error("chat notification participants query failed", {
      conversationId,
      userId: user.id,
      participantsError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!participants?.length) {
    return NextResponse.json({ success: true });
  }

  const thresholdIso = new Date(
    Date.now() - DUPLICATE_NOTIFICATION_WINDOW_SECONDS * 1000
  ).toISOString();

  const dedupedRecipients: string[] = [];

  for (const participant of participants) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", participant.user_id)
      .eq("actor_id", user.id)
      .eq("type", "chat")
      .eq("activity_id", activityId ?? null)
      .gte("created_at", thresholdIso)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      dedupedRecipients.push(participant.user_id);
    }
  }

  if (!dedupedRecipients.length) {
    return NextResponse.json({ success: true, skipped: "deduped" });
  }

  await admin.from("notifications").insert(
    dedupedRecipients.map((userId) => ({
      user_id: userId,
      actor_id: user.id,
      type: "chat",
      message: "sent you a message",
      activity_id: activityId,
    }))
  );

  return NextResponse.json({ success: true });
}
