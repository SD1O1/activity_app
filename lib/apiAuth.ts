import type { User } from "@supabase/supabase-js";
import { errorResponse } from "@/lib/apiResponses";

export async function requireApiUser(supabase: {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null };
      error: unknown;
    }>;
  };
}): Promise<{ user: User } | { response: ReturnType<typeof errorResponse> }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: errorResponse("Unauthorized", 401, "UNAUTHORIZED") };
  }

  return { user };
}