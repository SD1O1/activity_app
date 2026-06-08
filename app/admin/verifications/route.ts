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

    if (ALLOWED_STATUSES.has(status)) {
      verificationQuery = verificationQuery.eq("verification_status", status);
    }

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
