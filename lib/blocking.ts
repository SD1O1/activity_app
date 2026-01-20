import { SupabaseClient } from "@supabase/supabase-js";

export async function getBlockedUserIds(
  supabase: SupabaseClient,
  viewerId: string
) {
  // Users I blocked
  const { data: blockedByMe } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", viewerId);

  // Users who blocked me
  const { data: blockedMe } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocked_id", viewerId);

  return {
    blockedUserIds: [
      ...(blockedByMe?.map((b) => b.blocked_id) ?? []),
      ...(blockedMe?.map((b) => b.blocker_id) ?? []),
    ],
  };
}