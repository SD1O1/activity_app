import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { activityId, userId: requestedUserId } = await req.json();
    const targetUserId = requestedUserId as string | undefined;

    if (!activityId || !targetUserId) {
      return NextResponse.json({ error: "Missing activityId or userId" }, { status: 400 });
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

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("id, host_id, member_count, max_members, status")
      .eq("id", activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const callerIsHost = activity.host_id === user.id;
    const callerIsSelf = user.id === targetUserId;

    if (!callerIsHost && !callerIsSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!callerIsHost && targetUserId === activity.host_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (targetUserId === activity.host_id) {
      return NextResponse.json(
        { error: "Host cannot be removed via this endpoint" },
        { status: 400 }
      );
    }

    const { data: membership } = await admin
      .from("activity_members")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { error: removeError } = await admin
      .from("activity_members")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", targetUserId);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }

    if (activity.member_count > 0) {
      await admin
        .from("activities")
        .update({
          member_count: activity.member_count - 1,
        })
        .eq("id", activityId);
    }

    if (
      activity.status === "full" &&
      activity.member_count - 1 < activity.max_members
    ) {
      await admin.from("activities").update({ status: "open" }).eq("id", activityId);
    }

    const { data: conversation } = await admin
      .from("conversations")
      .select("id")
      .eq("activity_id", activityId)
      .single();

    if (conversation) {
      await admin
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversation.id)
        .eq("user_id", targetUserId);
    }

    if (callerIsHost && targetUserId !== user.id) {
      await admin.from("notifications").insert({
        user_id: targetUserId,
        actor_id: user.id,
        type: "removed_from_activity",
        message: "You were removed from an activity by the host.",
        activity_id: activityId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("remove-member error", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}