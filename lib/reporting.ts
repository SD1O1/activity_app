import { supabase } from "@/lib/supabaseClient";

type ReportTargetType = "profile" | "activity";

type CreateReportParams = {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason?: string | null;
  message?: string | null;
};

type HasReportedParams = {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
};

/**
 * Create a report (profile or activity)
 */
export async function createReport({
  reporterId,
  targetType,
  targetId,
  reason,
  message,
}: CreateReportParams) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason: reason ?? null,
    message: message ?? null,
  });

  if (error) {
    console.error("CREATE REPORT ERROR:", error);
    throw error;
  }
}

/**
 * Check if user already reported a target
 */
export async function hasReported({
  reporterId,
  targetType,
  targetId,
}: HasReportedParams): Promise<boolean> {
  const { data, error } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", reporterId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (error) {
    console.error("HAS REPORTED ERROR:", error);
    return false;
  }

  return Boolean(data);
}