import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

type RemoveMemberRpcResult = {
  ok: boolean;
  code: string;
  message: string;
};

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

    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "remove_member_atomic",
      {
        p_activity_id: activityId,
        p_actor_id: user.id,
        p_target_user_id: targetUserId,
      }
    );

    if (rpcError) {
      console.error("remove-member rpc failed", {
        activityId,
        actorId: user.id,
        targetUserId,
        rpcError,
      });
      return NextResponse.json(
        {
          error:
            "Failed to remove member atomically. Ensure remove_member_atomic() exists and integrity constraints are applied.",
        },
        { status: 500 }
      );
    }

    const result = (rpcResult ?? {}) as RemoveMemberRpcResult;

    if (result.ok) {
      return NextResponse.json({ success: true });
    }

    if (result.code === "BAD_REQUEST") {
      return NextResponse.json({ error: result.message || "Invalid request" }, { status: 400 });
    }

    if (result.code === "UNAUTHORIZED") {
      return NextResponse.json({ error: result.message || "Unauthorized" }, { status: 401 });
    }

    if (result.code === "FORBIDDEN") {
      return NextResponse.json({ error: result.message || "Forbidden" }, { status: 403 });
    }

    if (result.code === "NOT_FOUND") {
      return NextResponse.json({ error: result.message || "Not found" }, { status: 404 });
    }

    if (result.code === "CONFLICT") {
      return NextResponse.json({ error: result.message || "Conflict" }, { status: 409 });
    }

    return NextResponse.json(
      { error: result.message || "Internal server error" },
      { status: 500 }
    );
  } catch (err) {
    console.error("remove-member error", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}