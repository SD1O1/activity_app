import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { conversationId, seenAt } = await req.json();

  if (!conversationId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let parsedSeenAt: string;
  if (seenAt) {
    const seenDate = new Date(seenAt);
    if (!Number.isFinite(seenDate.getTime())) {
      return NextResponse.json({ error: "Invalid seenAt" }, { status: 400 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, seenAt: parsedSeenAt });
}