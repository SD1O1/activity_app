import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { isAdminUserId } from "@/lib/adminAuth";
import { logger } from "@/lib/logger";

const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);
const VERIFICATION_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_VERIFICATION_PHOTOS_BUCKET ??
  "verification-photos";

type VerificationRow = {
  id: string;
  verification_status: string | null;
  verification_video_path: string | null;
  phone_verified: boolean | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
};

type VerificationAction = "approve" | "reject";

function toStatus(action: VerificationAction) {
  return action === "approve" ? "approved" : "rejected";
}

export async function GET(req: Request) {
  try {
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

    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() || "pending";

    const admin = createSupabaseAdmin();
    let verificationQuery = admin
      .from("profile_private")
      .select("id, verification_status, verification_video_path, phone_verified")
      .not("verification_video_path", "is", null)
      .order("id", { ascending: true })
      .limit(200);

    const { data: verificationRows, error: verificationError } =
      await verificationQuery;

    if (verificationError) {
      logger.error("admin_verifications.fetch_profile_private_failed", {
        error: verificationError,
        userId: user.id,
        status,
      });
      return errorResponse("Failed to fetch verification queue", 500, "INTERNAL");
    }

    const queue = (verificationRows ?? []) as VerificationRow[];
    const profileIds = queue.map((row) => row.id);

    const profileMap = new Map<string, ProfileRow>();
    if (profileIds.length > 0) {
      const { data: profiles, error: profilesError } = await admin
        .from("profiles")
        .select("id, name, username, avatar_url, verified")
        .in("id", profileIds);

      if (profilesError) {
        logger.error("admin_verifications.fetch_profiles_failed", {
          error: profilesError,
          userId: user.id,
          profileIdsCount: profileIds.length,
        });
        return errorResponse("Failed to fetch verification queue", 500, "INTERNAL");
      }

      (profiles ?? []).forEach((profile) => {
        profileMap.set(profile.id as string, profile as ProfileRow);
      });
    }

    const verifications = await Promise.all(
      queue.map(async (row) => {
        let videoUrl: string | null = null;

        if (row.verification_video_path) {
          const { data: signedData, error: signedUrlError } = await admin.storage
            .from(VERIFICATION_BUCKET)
            .createSignedUrl(row.verification_video_path, 60 * 60);

          if (signedUrlError) {
            logger.warn("admin_verifications.create_signed_url_failed", {
              error: signedUrlError,
              userId: user.id,
              profileId: row.id,
            });
          } else {
            videoUrl = signedData.signedUrl;
          }
        }

        const profile = profileMap.get(row.id);

        return {
          id: row.id,
          verificationStatus: row.verification_status ?? "pending",
          verificationVideoPath: row.verification_video_path,
          verificationVideoUrl: videoUrl,
          phoneVerified: row.phone_verified ?? false,
          profile: {
            name: profile?.name ?? null,
            username: profile?.username ?? null,
            avatarUrl: profile?.avatar_url ?? null,
            verified: profile?.verified ?? false,
          },
        };
      })
    );

    return successResponse({ verifications });
  } catch (error) {
    logger.error("admin_verifications.unhandled", { error });
    return errorResponse("Failed to fetch verification queue", 500, "INTERNAL");
  }
}

export async function PATCH(req: Request) {
  try {
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

    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();

    if (!id) {
      return errorResponse("Missing verification id", 400, "BAD_REQUEST");
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
