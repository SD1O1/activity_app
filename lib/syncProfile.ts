import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export async function syncProfile(user: User | null) {
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
  });
}
