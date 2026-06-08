import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { isAdminUserId } from "@/lib/adminAuth";
import { logger } from "@/lib/logger";

type VerificationAction = "approve" | "reject";

function toStatus(action: VerificationAction) {
  return action === "approve" ? "approved" : "rejected";
}

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
      | { action?: VerificationAction }
      | null;

    if (!body?.action || (body.action !== "approve" && body.action !== "reject")) {
      return errorResponse("Invalid action", 400, "BAD_REQUEST");
    }

    const admin = createSupabaseAdmin();
    const nextStatus = toStatus(body.action);

    const { error: privateError } = await admin
      .from("profile_private")
      .update({ verification_status: nextStatus })
      .eq("id", id);

    if (privateError) {
      logger.error("admin_verifications.update_private_failed", {
        error: privateError,
        userId: user.id,
        profileId: id,
        action: body.action,
      });
      return errorResponse("Failed to update verification", 500, "INTERNAL");
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ verified: body.action === "approve" })
      .eq("id", id);

    if (profileError) {
      logger.error("admin_verifications.update_profile_failed", {
        error: profileError,
        userId: user.id,
        profileId: id,
        action: body.action,
      });
      return errorResponse("Failed to update verification", 500, "INTERNAL");
    }

    return successResponse({
      message:
        body.action === "approve"
          ? "Profile verified successfully"
          : "Profile verification rejected",
      verificationStatus: nextStatus,
      verified: body.action === "approve",
    });
  } catch (error) {
    logger.error("admin_verifications.update_unhandled", { error });
    return errorResponse("Failed to update verification", 500, "INTERNAL");
  }
}
