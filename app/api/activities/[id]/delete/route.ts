import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

type DeleteActivityRpcResult = {
  ok: boolean;
  code: string;
  message: string;
};

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

  const { data: rpcResult, error: rpcError } = await admin.rpc(
    "delete_activity_cascade_atomic",
    {
      p_activity_id: activityId,
      p_actor_id: user.id,
    }
  );

  if (rpcError) {
    console.error("activity delete cascade rpc failed", {
      activityId,
      userId: user.id,
      rpcError,
    });
    return NextResponse.json(
      {
        error:
          "Failed to delete activity atomically. Ensure delete_activity_cascade_atomic() exists and cleanup constraints/indexes are applied.",
      },
      { status: 500 }
    );
  }

  const result = (rpcResult ?? {}) as DeleteActivityRpcResult;

  if (result.ok) {
    return NextResponse.json({ success: true });
  }

  if (result.code === "NOT_FOUND") {
    return NextResponse.json({ error: result.message || "Activity not found" }, { status: 404 });
  }

  if (result.code === "FORBIDDEN") {
    return NextResponse.json({ error: result.message || "Forbidden" }, { status: 403 });
  }

  if (result.code === "BAD_REQUEST") {
    return NextResponse.json({ error: result.message || "Invalid request" }, { status: 400 });
  }

  return NextResponse.json(
    { error: result.message || "Internal server error" },
    { status: 500 }
  );
}
