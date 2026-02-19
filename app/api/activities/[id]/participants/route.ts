import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
} from "@/lib/supabaseServer";

export async function GET(
  _request: Request,
  { params }: { params: { id?: string } | Promise<{ id?: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const activityId = resolvedParams?.id;

    if (!activityId) {
      return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    const { data: activity, error: activityError } = await admin
      .from("activities")
      .select("host_id")
      .eq("id", activityId)
      .neq("status", "deleted")
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const { data: hostProfile, error: hostError } = await admin
      .from("profiles")
      .select("id, username, name, avatar_url, verified")
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
          username,
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