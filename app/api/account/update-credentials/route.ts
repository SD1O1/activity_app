import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";
import { parseJsonBody } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rateLimit";

const bodySchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((value) => !!value.email || !!value.password, {
    message: "Provide email and/or password.",
  });

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, bodySchema);
    if ("error" in parsed) return parsed.error;

    const email = parsed.data.email?.trim();
    const password = parsed.data.password;

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const rateLimitResponse = await enforceRateLimit({
      routeKey: "update-credentials",
      userId: user.id,
      request: req,
      limit: 10,
      windowMs: 60_000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    if (email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({ email });
      if (emailUpdateError) {
        logger.warn("update_credentials.email_update_failed", { userId: user.id, emailUpdateError });
        return errorResponse("Failed to update credentials.", 400, "BAD_REQUEST");
      }
    }

    if (password) {
      const { error: passwordUpdateError } = await admin.auth.admin.updateUserById(user.id, {
        password,
      });

      if (passwordUpdateError) {
        logger.warn("update_credentials.password_update_failed", { userId: user.id, passwordUpdateError });
        return errorResponse("Failed to update credentials.", 400, "BAD_REQUEST");
      }
    }

    return successResponse(undefined, 200);
  } catch (error) {
    logger.error("update_credentials.unhandled", { error });
    return errorResponse("Internal server error", 500, "INTERNAL");
  }
}
