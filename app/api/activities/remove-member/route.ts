import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { activityId, userId } = await req.json();

    if (!activityId || !userId) {
      return NextResponse.json(
        { error: "Missing activityId or userId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    );

    /* ───────────────── FETCH ACTIVITY (for host check) ───────────────── */
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, host_id, member_count, max_members, status")
      .eq("id", activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const hostId = activity.host_id;

    /* ───────────────── REMOVE MEMBER ───────────────── */
    const { error: removeError } = await supabase
      .from("activity_members")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", userId);

    if (removeError) {
      return NextResponse.json(
        { error: removeError.message },
        { status: 500 }
      );
    }

    /* ───────────────── UPDATE MEMBER COUNT ───────────────── */
    if (activity.member_count > 0) {
      await supabase
        .from("activities")
        .update({
          member_count: activity.member_count - 1,
        })
        .eq("id", activityId);
    }

    /* ───────────────── REOPEN IF WAS FULL ───────────────── */
    if (
      activity.status === "full" &&
      activity.member_count - 1 < activity.max_members
    ) {
      await supabase
        .from("activities")
        .update({ status: "open" })
        .eq("id", activityId);
    }

    /* ───────────────── REMOVE FROM CHAT ───────────────── */
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("activity_id", activityId)
      .single();

    if (conversation) {
      await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversation.id)
        .eq("user_id", userId);
    }

    /* ───────────────── NOTIFY REMOVED USER ───────────────── */
    // Only notify if host removed a guest (not self)
    if (userId !== hostId) {
      await supabase.from("notifications").insert({
        user_id: userId,           // removed user
        actor_id: hostId,           // host
        type: "removed_from_activity",
        message: "You were removed from an activity by the host.",
        activity_id: activityId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("remove-member error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}