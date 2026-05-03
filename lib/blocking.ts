import { SupabaseClient } from "@supabase/supabase-js";

export async function getBlockedUserIds(
  supabase: SupabaseClient,
  viewerId: string
) {
  const [{ data: blockedByMe }, { data: blockedMe }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", viewerId),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", viewerId),
  ]);

  return {
    blockedUserIds: [
      ...(blockedByMe?.map((b) => b.blocked_id) ?? []),
      ...(blockedMe?.map((b) => b.blocker_id) ?? []),
    ],
  };
}
