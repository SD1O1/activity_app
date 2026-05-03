import { SupabaseClient, User } from "@supabase/supabase-js";

export async function syncProfile(
  supabaseClient: SupabaseClient,
  user: User | null
) {
  if (!user) return;

  await supabaseClient.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id", ignoreDuplicates: false }
  );
}
