import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

type RequestJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  duplicatePending?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const activityId = body?.activityId as string | undefined;
    const answers = Array.isArray(body?.answers)
      ? body.answers
          .map((answer: unknown) =>
            typeof answer === "string" ? answer.trim() : ""
          )
          .filter((answer: string) => answer.length > 0)
      : [];
    const message =
      typeof body?.message === "string"
        ? body.message
        : typeof body?.note === "string"
          ? body.note
          : null;

    if (!activityId) {
      return NextResponse.json({ success: false, error: "Missing activityId" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("id, host_id, status, starts_at, member_count, max_members")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ success: false, error: "Activity not found" }, { status: 404 });
    }

    if (activity.host_id === user.id) {
      return NextResponse.json(
        { success: false, error: "Hosts cannot request to join their own activity" },
        { status: 400 }
      );
    }

    const hasStarted = new Date(activity.starts_at).getTime() < Date.now();

    if (activity.status === "completed" || hasStarted) {
      if (activity.status !== "completed" && hasStarted) {
        await admin
          .from("activities")
          .update({ status: "completed" })
          .eq("id", activityId)
          .in("status", ["open", "full"]);
      }
      
      return NextResponse.json(
        { success: false, error: "Activity has already ended" },
        { status: 409 }
      );
    }

    if (activity.member_count >= activity.max_members || activity.status === "full") {
      return NextResponse.json(
        { success: false, error: "Activity is full" },
        { status: 409 }
      );
    }

    const { data: membership, error: membershipError } = await admin
      .from("activity_members")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("request-join membership check failed", {
        activityId,
        requesterId: user.id,
        membershipError,
      });
      return NextResponse.json(
        { success: false, error: "Failed to validate membership status" },
        { status: 500 }
      );
    }

    if (membership) {
      return NextResponse.json(
        { success: false, error: "You are already a member of this activity" },
        { status: 409 }
      );
    }

    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "request_join_atomic",
      {
        p_activity_id: activityId,
        p_requester_id: user.id,
        p_message: message,
      }
    );

    if (rpcError) {
      console.error("request-join rpc failed", {
        activityId,
        requesterId: user.id,
        rpcError,
      });
      return NextResponse.json(
        {
          success: false, 
          error:
            "Failed to create join request atomically. Ensure request_join_atomic() is installed.",
        },
        { status: 500 }
      );
    }

    const result = (rpcResult ?? {}) as RequestJoinRpcResult;

    if (result.ok) {
      if (answers.length > 0) {
        const { error: answersError } = await admin
          .from("join_requests")
          .update({ answers })
          .eq("activity_id", activityId)
          .eq("requester_id", user.id)
          .eq("status", "pending");

        if (answersError) {
          console.error("request-join answers update failed", {
            activityId,
            requesterId: user.id,
            answersError,
          });
        }
      }
      return NextResponse.json({
        success: true,
        data: {
          message: result.message || "Join request sent",
          duplicatePending: Boolean(result.duplicatePending),
        },
      });
    }

    if (result.code === "BAD_REQUEST") {
      return NextResponse.json(
        { success: false, error: result.message || "Invalid request" },
        { status: 400 }
      );
    }

    if (result.code === "CONFLICT") {
      return NextResponse.json(
        { success: false, error: result.message || "Conflict" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: result.message || "Internal server error" },
      { status: 500 }
    );
  } catch (err) {
    console.error("request-join failed", { err });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}