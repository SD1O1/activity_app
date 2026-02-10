import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { receiverIds, actorId, activityId } = await req.json();

  if (!receiverIds?.length || !actorId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("notifications").insert(
    receiverIds.map((uid: string) => ({
      user_id: uid,
      actor_id: actorId,
      type: "chat",
      message: "sent you a message",
      activity_id: activityId,
    }))
  );

  return NextResponse.json({ success: true });
}