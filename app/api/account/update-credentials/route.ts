import { errorResponse, successResponse } from "@/lib/apiResponses";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";
import { requireApiUser } from "@/lib/apiAuth";

type RequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const password =
      typeof body.password === "string" ? body.password : undefined;

    if (!email && !password) {
      return errorResponse("Provide email and/or password.", 400);
    }

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const auth = await requireApiUser(supabase);
    if ("response" in auth) {
      return auth.response;
    }
    const { user } = auth;

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
    });

    if (updateError) {
      return errorResponse(updateError.message || "Failed to update credentials.", 400);
    }

    return successResponse(undefined, 200);
  } catch (error) {
    console.error("update-credentials failed", { error });
    return errorResponse("Internal server error", 500);
  }
}