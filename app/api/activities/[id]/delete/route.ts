import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await context.params;
  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: activity, error } = await admin
    .from("activities")
    .select("id, host_id")
    .eq("id", activityId)
    .single();

  if (error || !activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (activity.host_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: members } = await admin
    .from("activity_members")
    .select("user_id")
    .eq("activity_id", activityId)
    .neq("user_id", activity.host_id);

  if (members && members.length > 0) {
    await admin.from("notifications").insert(
      members.map((m) => ({
        user_id: m.user_id,
        actor_id: user.id,
        type: "activity_deleted",
        message: "An activity you joined was cancelled",
        activity_id: activityId,
      }))
    );
  }

  const { error: updateError } = await admin
    .from("activities")
    .update({ status: "deleted" })
    .eq("id", activityId);

  if (updateError) {
    console.error("activity delete failed", {
      activityId,
      userId: user.id,
      updateError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}