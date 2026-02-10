import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createSupabaseServer();

  const { data: activity } = await supabase
    .from("activities")
    .select("starts_at, status")
    .eq("id", id)
    .single();

  if (!activity) {
    return NextResponse.json({ success: false });
  }

  const now = new Date();
  const startsAt = new Date(activity.starts_at);

  if (startsAt < now && activity.status !== "completed") {
    await supabase
      .from("activities")
      .update({ status: "completed" })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}