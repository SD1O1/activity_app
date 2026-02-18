import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

type ApproveJoinRpcResult = {
  ok: boolean;
  code: string;
  message: string;
  approvedUserId?: string;
  joinMessage?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const joinRequestId =
      typeof body?.joinRequestId === "string" && body.joinRequestId.trim().length > 0
        ? body.joinRequestId.trim()
        : typeof body?.join_request_id === "string" && body.join_request_id.trim().length > 0
          ? body.join_request_id.trim()
          : undefined;

    const activityId =
      typeof body?.activityId === "string" && body.activityId.trim().length > 0
        ? body.activityId.trim()
        : typeof body?.id === "string" && body.id.trim().length > 0
          ? body.id.trim()
          : undefined;

    const participantId =
      typeof body?.participantId === "string" && body.participantId.trim().length > 0
        ? body.participantId.trim()
        : typeof body?.userId === "string" && body.userId.trim().length > 0
          ? body.userId.trim()
          : undefined;

    if (!joinRequestId && (!activityId || !participantId)) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: provide joinRequestId or both activityId and participantId",
        },
        { status: 400 }
      );
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

    let resolvedJoinRequestId = joinRequestId;

    if (!resolvedJoinRequestId) {
      const { data: joinRequest, error: joinRequestLookupError } = await supabase
        .from("join_requests")
        .select("id")
        .eq("activity_id", activityId)
        .eq("requester_id", participantId)
        .eq("status", "pending")
        .maybeSingle();

      if (joinRequestLookupError) {
        console.error("approve-join join request lookup failed", {
          joinRequestLookupError,
          activityId,
          participantId,
          userId: user.id,
        });
        return NextResponse.json(
          {
            error: joinRequestLookupError.message || "Failed to find join request",
          },
          { status: 500 }
        );
      }

      if (!joinRequest?.id) {
        return NextResponse.json(
          { error: "Pending join request not found for activityId and participantId" },
          { status: 400 }
        );
      }

      resolvedJoinRequestId = joinRequest.id;
    }

    let resolvedActivityId = activityId;
    let resolvedParticipantId = participantId;

    if (!resolvedActivityId || !resolvedParticipantId) {
      const { data: joinRequestMeta, error: joinRequestMetaError } = await admin
        .from("join_requests")
        .select("activity_id, requester_id")
        .eq("id", resolvedJoinRequestId)
        .maybeSingle();

      if (joinRequestMetaError) {
        console.error("approve-join join request metadata lookup failed", {
          joinRequestMetaError,
          joinRequestId: resolvedJoinRequestId,
          userId: user.id,
        });
      }

      if (joinRequestMeta) {
        resolvedActivityId = resolvedActivityId ?? joinRequestMeta.activity_id;
        resolvedParticipantId = resolvedParticipantId ?? joinRequestMeta.requester_id;
      }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "approve_join_request_atomic",
      {
        p_join_request_id: resolvedJoinRequestId,
      }
    );

    if (rpcError) {
      console.error("approve-join rpc failed", {
        rpcError,
        joinRequestId: resolvedJoinRequestId,
        activityId,
        participantId,
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
      const approvedUserId = result.approvedUserId ?? resolvedParticipantId;

      if (approvedUserId && resolvedActivityId) {
        const { data: conversation, error: conversationError } = await admin
          .from("conversations")
          .select("id")
          .eq("activity_id", resolvedActivityId)
          .maybeSingle();

        if (conversationError) {
          console.error("approve-join conversation lookup failed", {
            conversationError,
            activityId: resolvedActivityId,
            approvedUserId,
          });
        } else if (conversation?.id) {
          const { error: participantUpsertError } = await admin
            .from("conversation_participants")
            .upsert(
              {
                conversation_id: conversation.id,
                user_id: approvedUserId,
              },
              {
                onConflict: "conversation_id,user_id",
                ignoreDuplicates: true,
              }
            );

          if (participantUpsertError) {
            console.error("approve-join participant upsert failed", {
              participantUpsertError,
              conversationId: conversation.id,
              approvedUserId,
            });
          }
        }
      }
      return NextResponse.json(
        {
          ok: true,
          code: result.code || "OK",
          message: result.message || "Join request approved",
          approvedUserId: result.approvedUserId,
          joinMessage: result.joinMessage ?? null,
        },
        { status: 200 }
      );
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

    if (result.code === "BAD_REQUEST") {
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
  } catch (error) {
    console.error("POST /api/activities/approve-join failed", {
      error,
      route: "/api/activities/approve-join",
    });
    const message = error instanceof Error ? error.message : "Malformed request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}