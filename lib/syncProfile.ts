import { supabase } from "./supabaseClient";

export async function syncProfile(user: any) {
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
  });

}