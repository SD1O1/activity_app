import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // ✅ FIX: params must be awaited
  const { id: activityId } = await context.params;

  const supabase = createSupabaseServer();
  const body = await req.json();

  const {
    title,
    description,
    type,
    max_members,
    cost_rule,
    host_id,
  } = body;

  if (!host_id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 1️⃣ Fetch activity
  const { data: activity, error: fetchError } = await supabase
    .from("activities")
    .select("id, host_id")
    .eq("id", activityId)
    .single();

  if (fetchError || !activity) {
    return NextResponse.json(
      { error: "Activity not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Host-only check
  if (activity.host_id !== host_id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 3️⃣ Update
  const { error: updateError } = await supabase
    .from("activities")
    .update({
      title,
      description,
      type,
      cost_rule,
      max_members,
    })
    .eq("id", activityId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true },
    { status: 200 }
  );
}