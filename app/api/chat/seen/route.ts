import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { conversationId, seenAt } = await req.json();

  if (!conversationId) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  let parsedSeenAt: string;
  if (seenAt) {
    const seenDate = new Date(seenAt);
    if (!Number.isFinite(seenDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid seenAt" }, { status: 400 });
    }
    parsedSeenAt = seenDate.toISOString();
  } else {
    parsedSeenAt = new Date().toISOString();
  }

  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: convo, error: convoError } = await admin
    .from("conversations")
    .select("id, activity_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError || !convo) {
    return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }

    if (!isActivityMember) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { seenAt: parsedSeenAt } });
}