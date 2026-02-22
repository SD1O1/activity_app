import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("host_id, title")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (activity.host_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: members, error: membersError } = await admin
      .from("activity_members")
      .select("user_id")
      .eq("activity_id", activityId)
      .neq("user_id", activity.host_id);

    if (membersError || !members) {
      return NextResponse.json(
        { error: "Failed to load members" },
        { status: 500 }
      );
    }

    if (members.length === 0) {
      return NextResponse.json({ success: true });
    }

    const notifications = members.map((m) => ({
      user_id: m.user_id,
      actor_id: user.id,
      type: "activity_updated",
      message: `Activity "${activity.title}" has been updated`,
      activity_id: activityId,
    }));

    const { error: notifyError } = await admin
      .from("notifications")
      .insert(notifications);

    if (notifyError) {
      console.error("notify update failed", {
        activityId,
        userId: user.id,
        notifyError,
      });
      return NextResponse.json(
        { error: "Failed to notify participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("notify-update error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}