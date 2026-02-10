import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await context.params;
  const supabase = createSupabaseServer();

  // 1️⃣ Get activity (to know host)
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("host_id, title")
    .eq("id", activityId)
    .single();

  if (activityError || !activity) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Get approved members (exclude host)
  const { data: members, error: membersError } = await supabase
    .from("activity_members")
    .select("user_id")
    .eq("activity_id", activityId)
    .neq("user_id", activity.host_id);

  if (membersError || !members || members.length === 0) {
    // No members → nothing to notify
    return NextResponse.json({ success: true });
  }

  // 3️⃣ Create notifications
  const notifications = members.map((m) => ({
    user_id: m.user_id,
    actor_id: activity.host_id,
    type: "activity_updated",
    message: `Activity "${activity.title}" has been updated`,
    activity_id: activityId,
  }));

  const { error: notifyError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (notifyError) {
    // IMPORTANT: do NOT fail the request
    console.error("Notify update failed:", notifyError.message);
  }

  return NextResponse.json({ success: true });
}