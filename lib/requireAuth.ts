import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function requireAuth() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return user;
}