import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await context.params; // ✅ FIX
  const supabase = createSupabaseServer();

  /* 1️⃣ Fetch activity */
  const { data: activity, error } = await supabase
    .from("activities")
    .select("id, host_id")
    .eq("id", activityId)
    .single();

  if (error || !activity) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 404 }
    );
  }

  /* 2️⃣ Notify participants */
  const { data: members } = await supabase
    .from("activity_members")
    .select("user_id")
    .eq("activity_id", activityId)
    .neq("user_id", activity.host_id);

  if (members && members.length > 0) {
    await supabase.from("notifications").insert(
      members.map((m) => ({
        user_id: m.user_id,
        actor_id: activity.host_id,
        type: "activity_deleted",
        message: "An activity you joined was cancelled",
        activity_id: activityId,
      }))
    );
  }

  /* 3️⃣ SOFT DELETE */
  const { error: updateError } = await supabase
    .from("activities")
    .update({ status: "deleted" })
    .eq("id", activityId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}