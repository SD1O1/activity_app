import { NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabaseServer";

export async function POST() {
  const supabase = await createSupabaseServer();
  const admin = createSupabaseAdmin();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("activities")
    .update({ status: "completed" })
    .in("status", ["open", "full"])
    .lt("starts_at", nowIso)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to complete stale activities" }, { status: 500 });
  }

  return NextResponse.json({ success: true, updatedCount: data?.length ?? 0 });
}