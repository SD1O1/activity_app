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
      .select("starts_at, status")
      .eq("id", id)
      .neq("status", "deleted")
      .single();

    if (activityError) {
      return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
    }

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const now = new Date();
    const startsAt = new Date(activity.starts_at);

    if (startsAt < now && activity.status !== "completed") {
      const { error: updateError } = await admin
        .from("activities")
        .update({ status: "completed" })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: "Failed to complete activity" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("auto-complete activity error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}