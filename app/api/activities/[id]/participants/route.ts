import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function GET(
  _request: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const activityId = resolvedParams?.id;

    // Temporary debug log for runtime param shape
    console.log("GET /api/activities/[id]/participants params", {
      rawParams: params,
      resolvedParams,
      activityId,
    });

    if (!activityId) {
      return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
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
      .select("host_id")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const isHost = activity.host_id === user.id;
    let isMember = false;

    if (!isHost) {
      const { data: member } = await admin
        .from("activity_members")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      isMember = !!member;
    }

    if (!isHost && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: hostProfile, error: hostError } = await admin
      .from("profiles")
      .select("id, name, avatar_url, verified")
      .eq("id", activity.host_id)
      .single();

    if (hostError || !hostProfile) {
      return NextResponse.json(
        { error: "Host profile not found" },
        { status: 500 }
      );
    }

    const { data: members, error: membersError } = await admin
      .from("activity_members")
      .select(`
        profiles!activity_members_user_fk(
          id,
          name,
          avatar_url,
          verified
        )
      `)
      .eq("activity_id", activityId)
      .eq("status", "active");

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
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

    return NextResponse.json(participants, { status: 200 });
  } catch (error) {
    console.error("GET /api/activities/[id]/participants failed", {
      error,
      params,
    });
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}