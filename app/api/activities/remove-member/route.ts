import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";
import { safeJson } from "@/lib/safeJson";

type RemoveMemberRpcResult = {
  ok: boolean;
  code: string;
  message: string;
};

export async function POST(req: Request) {
  try {
    const { data: payload, errorResponse } = await safeJson<{
      activityId?: string;
      userId?: string;
    }>(req);

    if (errorResponse) {
      return errorResponse;
    }

    const { activityId, userId: requestedUserId } = payload ?? {};
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

    const { data: activityForNotification } = await admin
      .from("activities")
      .select("id, host_id, title")
      .eq("id", activityId)
      .maybeSingle();

    const notifyHostForSelfLeave =
      !!activityForNotification &&
      targetUserId === user.id &&
      targetUserId !== activityForNotification.host_id;

    const sendHostLeaveNotification = async () => {
      if (!notifyHostForSelfLeave || !activityForNotification) return;

      const { data: actorProfile } = await admin
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .maybeSingle();

      const actorName = actorProfile?.name || actorProfile?.username || "A participant";

      const { error: notifyError } = await admin.from("notifications").insert({
        user_id: activityForNotification.host_id,
        actor_id: user.id,
        type: "member_left",
        message: `${actorName} has left '${activityForNotification.title}' activity`,
        activity_id: activityId,
      });

      if (notifyError) {
        console.error("failed to notify host after participant left", {
          activityId,
          actorId: user.id,
          notifyError,
        });
      }
    };

    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "remove_member_atomic",
      {
        p_activity_id: activityId,
        p_actor_id: user.id,
        p_target_user_id: targetUserId,
      }
    );

    if (rpcError) {
      console.error("remove-member rpc failed, trying fallback", {
        activityId,
        actorId: user.id,
        targetUserId,
        rpcError,
      });
      const { data: activity, error: activityError } = await admin
        .from("activities")
        .select("id, host_id, status, member_count, max_members")
        .eq("id", activityId)
        .neq("status", "deleted")
        .maybeSingle();

      if (activityError) {
        return NextResponse.json(
          { error: activityError.message || "Failed to load activity" },
          { status: 500 }
        );
      }

      if (!activity) {
        return NextResponse.json({ error: "Activity not found" }, { status: 404 });
      }

      const isHost = activity.host_id === user.id;
      const isSelfRemoval = user.id === targetUserId;

      if (!isHost && !isSelfRemoval) {
        return NextResponse.json(
          { error: "Only the host can remove other participants" },
          { status: 403 }
        );
      }

      if (targetUserId === activity.host_id) {
        return NextResponse.json(
          { error: "Host cannot be removed from their own activity" },
          { status: 400 }
        );
      }

      const { data: member, error: memberLookupError } = await admin
        .from("activity_members")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .maybeSingle();

      if (memberLookupError) {
        return NextResponse.json(
          { error: memberLookupError.message || "Failed to validate membership" },
          { status: 500 }
        );
      }

      if (!member?.id) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const { error: deleteMembershipError } = await admin
        .from("activity_members")
        .delete()
        .eq("id", member.id);

      if (deleteMembershipError) {
        return NextResponse.json(
          { error: deleteMembershipError.message || "Failed to remove member" },
          { status: 500 }
        );
      }

      const { data: conversation, error: conversationError } = await admin
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId)
        .maybeSingle();

      if (conversationError) {
        console.error("remove-member fallback conversation lookup failed", {
          conversationError,
          activityId,
          targetUserId,
        });
      }

      if (conversation?.id) {
        const { error: deleteConversationParticipantError } = await admin
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversation.id)
          .eq("user_id", targetUserId);

        if (deleteConversationParticipantError) {
          return NextResponse.json(
            {
              error:
                deleteConversationParticipantError.message ||
                "Failed to remove conversation participant",
            },
            { status: 500 }
          );
        }
      }

      const { count: activeMemberCount, error: memberCountError } = await admin
        .from("activity_members")
        .select("id", { count: "exact", head: true })
        .eq("activity_id", activityId)
        .eq("status", "active");

      if (memberCountError || activeMemberCount === null) {
        return NextResponse.json(
          { error: memberCountError?.message || "Failed to recalculate member count" },
          { status: 500 }
        );
      }

      const nextStatus =
        activity.status === "full" && activeMemberCount < activity.max_members
          ? "open"
          : activity.status;

      const { error: updateActivityError } = await admin
        .from("activities")
        .update({
          member_count: activeMemberCount,
          status: nextStatus,
        })
        .eq("id", activityId);

      if (updateActivityError) {
        return NextResponse.json(
          { error: updateActivityError.message || "Failed to update activity" },
          { status: 500 }
        );
      }

      await sendHostLeaveNotification();
      return NextResponse.json({ success: true, mode: "fallback" });
    }

    const result = (rpcResult ?? {}) as RemoveMemberRpcResult;

    if (result.ok) {
      await sendHostLeaveNotification();
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