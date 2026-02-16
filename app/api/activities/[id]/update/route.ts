import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: activityId } = await context.params;
  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();
  const body = await req.json();

  const { title, description, type, max_members, cost_rule } = body;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: activity, error: fetchError } = await admin
    .from("activities")
    .select("id, host_id")
    .eq("id", activityId)
    .neq("status", "deleted")
    .single();

  if (fetchError || !activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (activity.host_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateError } = await admin
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
    console.error("activity update failed", {
      activityId,
      userId: user.id,
      updateError,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}