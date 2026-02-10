import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { joinRequestId } = await req.json();

    if (!joinRequestId) {
      return NextResponse.json(
        { error: "Missing joinRequestId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServer();

    // 1️⃣ Fetch join request
    const { data: joinRequest, error: jrError } = await supabase
      .from("join_requests")
      .select("id, activity_id, requester_id")
      .eq("id", joinRequestId)
      .single();

    if (jrError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Fetch activity + validate status
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, title, status, member_count, max_members, host_id")
      .eq("id", joinRequest.activity_id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.status === "completed") {
      return NextResponse.json(
        { error: "Activity has already ended" },
        { status: 400 }
      );
    }

    if (
      activity.status === "full" ||
      activity.member_count >= activity.max_members
    ) {
      return NextResponse.json(
        { error: "Activity is full" },
        { status: 400 }
      );
    }

    // 3️⃣ Add member
    await supabase.from("activity_members").insert({
      activity_id: joinRequest.activity_id,
      user_id: joinRequest.requester_id,
      role: "member",
      status: "active",
    });

    // 4️⃣ Increment member count (atomic)
    await supabase.rpc("increment_member_count", {
      activity_id_input: joinRequest.activity_id,
    });

    // 5️⃣ Re-check count and mark FULL if needed
    const { data: updatedActivity } = await supabase
      .from("activities")
      .select("member_count, max_members")
      .eq("id", joinRequest.activity_id)
      .single();

    if (
      updatedActivity &&
      updatedActivity.member_count >= updatedActivity.max_members
    ) {
      await supabase
        .from("activities")
        .update({ status: "full" })
        .eq("id", joinRequest.activity_id);
    }

    // 6️⃣ Approve join request
    await supabase
      .from("join_requests")
      .update({ status: "approved" })
      .eq("id", joinRequestId);

    // 7️⃣ 🔔 Notify the guest
    await supabase.from("notifications").insert({
      user_id: joinRequest.requester_id, // guest
      actor_id: activity.host_id,        // host
      type: "join_approved",
      message: `Your request to join "${activity.title}" was approved`,
      activity_id: joinRequest.activity_id,
    });

    // 7️⃣ Ensure user is in conversation_participants
    const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("activity_id", joinRequest.activity_id)
    .single();

    if (conversation) {
    await supabase
      .from("conversation_participants")
      .upsert(
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
    console.error("Approve join failed", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}