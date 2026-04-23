import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { isAdminUserId } from "@/lib/adminAuth";
import { logger } from "@/lib/logger";

const ALLOWED_STATUSES = new Set([
  "open",
  "under_review",
  "resolved",
  "dismissed",
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!isAdminUserId(user.id)) {
      return errorResponse("Forbidden", 403, "FORBIDDEN");
    }

    const body = (await req.json().catch(() => null)) as
      | { status?: string; reviewNote?: string | null }
      | null;

    if (!body?.status || !ALLOWED_STATUSES.has(body.status)) {
      return errorResponse("Invalid status", 400, "BAD_REQUEST");
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("reports")
      .update({
        status: body.status,
        review_note: body.reviewNote ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.error("admin_reports.status_update_failed", {
        error,
        userId: user.id,
        reportId: id,
        status: body.status,
      });
      return errorResponse("Failed to update report", 500, "INTERNAL");
    }

    return successResponse({ message: "Report updated" });
  } catch (error) {
    logger.error("admin_reports.status_update_unhandled", { error });
    return errorResponse("Failed to update report", 500, "INTERNAL");
  }
}

