import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Auth-aware server client (uses request cookies/session).
 * Use this in Route Handlers / Server Components when caller identity matters.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Route handlers may refresh tokens; best effort cookie write.
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // noop in contexts where cookies are read-only
            }
          }
        },
      },
    }
  );
}

/**
 * Admin client for trusted server-side writes that must bypass RLS.
 * Always pair usage with explicit authn/authz checks via createSupabaseServer().
 */
export function createSupabaseAdmin() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}