import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

type ApproveJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  approvedUserId?: string;
  joinMessage?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const joinRequestId =
      typeof body?.joinRequestId === "string" ? body.joinRequestId : undefined;

    if (!joinRequestId) {
      return NextResponse.json({ error: "Missing joinRequestId" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "approve_join_request_atomic",
      {
        p_join_request_id: joinRequestId,
      }
    );

    if (rpcError) {
      console.error("approve_join rpc failed", {
        rpcError,
        joinRequestId,
        userId: user.id,
      });
      return NextResponse.json(
        {
          error: rpcError.message || "Failed to approve join request",
          code: "RPC_ERROR",
        },
        { status: 500 }
      );
    }

    const result = (rpcResult ?? {}) as ApproveJoinRpcResult;

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        code: result.code || "OK",
        message: result.message || "Join request approved",
        approvedUserId: result.approvedUserId,
        joinMessage: result.joinMessage ?? null,
      });
    }

    if (
      result.code === "BAD_REQUEST" ||
      result.code === "UNAUTHORIZED" ||
      result.code === "FORBIDDEN" ||
      result.code === "NOT_FOUND"
    ) {
      return NextResponse.json({ error: result.message || "Invalid request" }, { status: 400 });
    }

    if (result.code === "CONFLICT") {
      return NextResponse.json({ error: result.message || "Conflict" }, { status: 409 });
    }

    return NextResponse.json(
      {
        error: result.message || "Failed to approve join request",
        code: result.code || "INTERNAL",
      },
      { status: 500 }
    );
  } catch (err) {
    console.error("approve-join failed", { err });
    const message = err instanceof Error ? err.message : "Malformed request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}