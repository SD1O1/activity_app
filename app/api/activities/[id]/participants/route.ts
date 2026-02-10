import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createSupabaseServer();

  // 1️⃣ Get activity (host_id only)
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("host_id")
    .eq("id", id)
    .single();

  if (activityError || !activity) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 500 }
    );
  }

  // 2️⃣ Get host profile (SEPARATE query)
  const { data: hostProfile, error: hostError } = await supabase
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

  // 3️⃣ Get joined members
  const { data: members, error: membersError } = await supabase
    .from("activity_members")
    .select(`
      profiles (
        id,
        name,
        avatar_url,
        verified
      )
    `)
    .eq("activity_id", id);

  if (membersError) {
    return NextResponse.json(
      { error: membersError.message },
      { status: 500 }
    );
  }

  // 4️⃣ Merge host + members
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