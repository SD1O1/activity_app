import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { joinRequestId } = await req.json();

    if (!joinRequestId) {
      return NextResponse.json({ error: "Missing joinRequestId" }, { status: 400 });
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

    const { data: joinRequest, error: jrError } = await admin
      .from("join_requests")
      .select("id, activity_id, requester_id, status")
      .eq("id", joinRequestId)
      .single();

    if (jrError || !joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 });
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json({ error: "Join request is not pending" }, { status: 400 });
    }

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("id, title, status, member_count, max_members, host_id")
      .eq("id", joinRequest.activity_id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (activity.host_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (activity.status === "completed") {
      return NextResponse.json({ error: "Activity has already ended" }, { status: 400 });
    }

    if (activity.status === "full" || activity.member_count >= activity.max_members) {
      return NextResponse.json({ error: "Activity is full" }, { status: 400 });
    }

    await admin.from("activity_members").insert({
      activity_id: joinRequest.activity_id,
      user_id: joinRequest.requester_id,
      role: "member",
      status: "active",
    });

    await admin.rpc("increment_member_count", {
      activity_id_input: joinRequest.activity_id,
    });

    const { data: updatedActivity } = await admin
      .from("activities")
      .select("member_count, max_members")
      .eq("id", joinRequest.activity_id)
      .single();

    if (
      updatedActivity &&
      updatedActivity.member_count >= updatedActivity.max_members
    ) {
      await admin
        .from("activities")
        .update({ status: "full" })
        .eq("id", joinRequest.activity_id);
    }

    await admin
      .from("join_requests")
      .update({ status: "approved" })
      .eq("id", joinRequestId);

    await admin.from("notifications").insert({
      user_id: joinRequest.requester_id,
      actor_id: user.id,
      type: "join_approved",
      message: `Your request to join "${activity.title}" was approved`,
      activity_id: joinRequest.activity_id,
    });

    const { data: conversation } = await admin
      .from("conversations")
      .select("id")
      .eq("activity_id", joinRequest.activity_id)
      .single();

    if (conversation) {
      await admin.from("conversation_participants").upsert(
        {
          conversation_id: conversation.id,
          user_id: joinRequest.requester_id,
          last_seen_at: null,
        },
        {
          onConflict: "conversation_id,user_id",
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("approve-join failed", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}