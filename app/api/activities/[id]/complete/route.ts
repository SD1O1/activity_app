import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: activity } = await supabase
    .from("activities")
    .select("host_id")
    .eq("id", id)
    .single();

  if (!activity || activity.host_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  await supabase
    .from("activities")
    .update({ status: "completed" })
    .eq("id", id);

  return NextResponse.json({ success: true });
}