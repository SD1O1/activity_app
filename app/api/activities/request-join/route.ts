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

    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "request_join_atomic",
      {
        p_activity_id: activityId,
        p_requester_id: user.id,
        p_answers: Array.isArray(answers) ? answers : [],
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
          error:
            "Failed to create join request atomically. Ensure request_join_atomic() and required constraints are applied.",
        },
        { status: 500 }
      );
    }

    const result = (rpcResult ?? {}) as RequestJoinRpcResult;

    if (result.ok) {
      return NextResponse.json({ success: true, duplicatePending: Boolean(result.duplicatePending) });
    }

    if (result.code === "BAD_REQUEST") {
      return NextResponse.json({ error: result.message || "Invalid request" }, { status: 400 });
    }

    if (result.code === "CONFLICT") {
      return NextResponse.json({ error: result.message || "Conflict" }, { status: 409 });
    }

    return NextResponse.json(
      { error: result.message || "Internal server error" },
      { status: 500 }
    );
  } catch (err) {
    console.error("request-join failed", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}