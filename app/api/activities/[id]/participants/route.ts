import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
    .eq("id", id)
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
      .eq("activity_id", id)
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
    return NextResponse.json({ error: "Host profile not found" }, { status: 500 });
  }

  const { data: members, error: membersError } = await admin
    .from("activity_members")
    .select(`
      profiles (
        id,
        name,
        avatar_url,
        verified
      )
    `)
    .eq("activity_id", id)
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
}