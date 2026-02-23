import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { insertNotifications } from "@/lib/notifications";

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

  const auth = await requireApiUser(supabase);
  if ("response" in auth) {
    return auth.response;
  }
  const { user } = auth;

  const { data: activity, error: activityError } = await admin
    .from("activities")
    .select("id, host_id, title")
    .eq("id", activityId)
    .maybeSingle();

  if (activityError || !activity) {
    return errorResponse("Activity not found", 404);
  }

  if (activity.host_id !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  const { data: members } = await admin
    .from("activity_members")
    .select("user_id")
    .eq("activity_id", activityId)
    .eq("status", "active")
    .neq("user_id", user.id);

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
        success: false,
        error:
          "Failed to delete activity atomically. Ensure delete_activity_cascade_atomic() exists and cleanup constraints/indexes are applied.",
      },
      { status: 500 }
    );
  }

  const result = (rpcResult ?? {}) as DeleteActivityRpcResult;

  if (result.ok) {
    if (members && members.length > 0) {
      const { error: notifyError } = await insertNotifications(
        admin,
        members.map((member) => ({
          user_id: member.user_id,
          actor_id: user.id,
          type: "activity_deleted",
          message: `"${activity.title}" was deleted by the host`,
          activity_id: null,
        }))
      );

      if (notifyError) {
        console.error("activity delete notification failed", {
          activityId,
          userId: user.id,
          notifyError,
        });
      }
    }

    return successResponse();
  }

  if (result.code === "NOT_FOUND") {
    return errorResponse(result.message || "Activity not found", 404);
  }

  if (result.code === "FORBIDDEN") {
    return errorResponse(result.message || "Forbidden", 403);
  }

  if (result.code === "BAD_REQUEST") {
    return errorResponse(result.message || "Invalid request", 400);
  }

  return errorResponse(result.message || "Internal server error", 500);
}