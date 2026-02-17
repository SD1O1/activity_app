import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

type ApproveJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  joinRequestMessage?: string;
};

export async function POST(req: Request) {
  try {
    const { joinRequestId } = await req.json();

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
          error:
            "Failed to approve join request atomically. Ensure approve_join_request_atomic() exists and is deployed.",
        },
        { status: 500 }
      );
    }

    const result = (rpcResult ?? {}) as ApproveJoinRpcResult;

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: result.message || "Approved",
        joinRequestMessage: result.joinRequestMessage ?? "",
      });
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
    console.error("approve-join failed", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}