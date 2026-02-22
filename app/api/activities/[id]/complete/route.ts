import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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
      .neq("status", "deleted")
      .single();

    if (activityError) {
      return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
    }

    if (!activity || activity.host_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("activities")
      .update({ status: "completed" })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to complete activity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("complete activity error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}