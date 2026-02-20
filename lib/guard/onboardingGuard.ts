// lib/onboardingGuard.ts
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function requireCompletedProfile() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → homepage
  if (!user) {
    return { user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dob, phone_verified, username")
    .eq("id", user.id)
    .single();

  const profileCompleted =
    !!profile?.dob &&
    profile?.phone_verified === true &&
    !!profile?.username;


  if (!profileCompleted) {
    redirect("/onboarding/profile");
  }

  return { user };
}