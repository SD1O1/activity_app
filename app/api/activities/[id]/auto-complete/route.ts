import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(
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

  const { data: activity } = await admin
    .from("activities")
    .select("starts_at, status")
    .eq("id", id)
    .neq("status", "deleted")
    .single();

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  const now = new Date();
  const startsAt = new Date(activity.starts_at);

  if (startsAt < now && activity.status !== "completed") {
    await admin.from("activities").update({ status: "completed" }).eq("id", id);
  }

  return NextResponse.json({ success: true });
}