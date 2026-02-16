import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { activityId, hostId, answers } = await req.json();

    if (!activityId || !hostId) {
      return NextResponse.json({ error: "Missing activityId or hostId" }, { status: 400 });
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
      .select("id, host_id, status")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity || activity.host_id !== hostId) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const { data: pendingRequest } = await admin
      .from("join_requests")
      .select("id")
      .eq("activity_id", activityId)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    const { error: upsertError } = await admin.from("join_requests").upsert(
      {
        activity_id: activityId,
        requester_id: user.id,
        status: "pending",
        answers: Array.isArray(answers) ? answers : [],
      },
      {
        onConflict: "activity_id,requester_id",
      }
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 409 });
    }

    if (!pendingRequest) {
      await admin.from("notifications").insert({
        user_id: hostId,
        actor_id: user.id,
        type: "join_request",
        message: "sent a join request",
        activity_id: activityId,
      });
    }

    return NextResponse.json({ success: true, duplicatePending: Boolean(pendingRequest) });
  } catch (err) {
    console.error("request-join failed", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
