import { errorResponse, successResponse } from "@/lib/apiResponses";
import { requireApiUser } from "@/lib/apiAuth";
import { logger } from "@/lib/logger";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { uuidSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const activityId = resolvedParams?.id;

    if (!activityId || !uuidSchema.safeParse(activityId).success) {
      return errorResponse("Invalid activityId", 400, "BAD_REQUEST");
    }

    const searchParams = new URL(request.url).searchParams;
    const rawLimit = Number(searchParams.get("limit") ?? "50");
    const rawOffset = Number(searchParams.get("offset") ?? "0");
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50)
      : 50;
    const offset = Number.isFinite(rawOffset)
      ? Math.max(Math.trunc(rawOffset), 0)
      : 0;

    const supabase = await createSupabaseServer();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("host_id")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return errorResponse("Activity not found", 404, "NOT_FOUND");
    }

    const isHost = activity.host_id === user.id;

    let isApprovedMember = false;
    if (!isHost) {
      const { data: member, error: memberError } = await supabase
        .from("activity_members")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (memberError) {
        logger.error("participants.member_check_failed", {
          activityId,
          userId: user.id,
          memberError,
        });
        return errorResponse("Internal server error", 500, "INTERNAL");
      }

      isApprovedMember = !!member;
    }

    if (!isHost && !isApprovedMember) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const { data: hostProfile, error: hostError } = await supabase
      .from("profiles")
      .select("id, username, name, avatar_url, verified")
      .eq("id", activity.host_id)
      .single();

    if (hostError || !hostProfile) {
      return errorResponse("Host profile not found", 404, "NOT_FOUND");
    }

    const { data: members, error: membersError } = await supabase
      .from("activity_members")
      .select(
        `
        profiles!activity_members_user_fk(
          id,
          username,
          name,
          avatar_url,
          verified
        )
      `
      )
      .eq("activity_id", activityId)
      .eq("status", "active")
      .range(offset, offset + limit - 1);

    if (membersError) {
      logger.error("participants.members_query_failed", {
        activityId,
        userId: user.id,
        membersError,
      });
      return errorResponse("Internal server error", 500, "INTERNAL");
    }

    const participants = [
      {
        ...hostProfile,
        role: "host",
      },
      ...(members ?? []).map((m) => ({
        ...m.profiles,
        role: "member",
      })),
    ];

    return successResponse(participants, 200);
  } catch (error) {
    logger.error("participants.unhandled", { error });
    return errorResponse("Failed to fetch participants", 500, "INTERNAL");
  }
}