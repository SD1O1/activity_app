import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await admin
      .from("activities")
      .update({ status: "completed" })
      .in("status", ["open", "full"])
      .lt("starts_at", nowIso)
      .select("id");

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to complete stale activities" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { updatedCount: data?.length ?? 0 } });
  } catch (error) {
    console.error("auto-complete-stale error", { error });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}