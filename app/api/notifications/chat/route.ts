import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { conversationId, activityId } = await req.json();

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

  await admin.from("notifications").insert(
    participants.map((p) => ({
      user_id: p.user_id,
      actor_id: user.id,
      type: "chat",
      message: "sent you a message",
      activity_id: activityId,
    }))
  );

  return NextResponse.json({ success: true });
}