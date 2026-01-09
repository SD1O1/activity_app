"use client";

import Header from "@/components/layout/Header";
import OnboardingProfile from "@/components/onboarding/OnboardingProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import AuthModal from "@/components/modals/AuthModal";
import { useState } from "react";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, profileCompleted, loading } = useClientAuthProfile();
  const [openAuth, setOpenAuth] = useState(false);

  useEffect(() => {
    if (loading) return;

    // ❌ Not logged in → auth
    if (!user) {
      setOpenAuth(true);
      return;
    }

    // ✅ Already completed onboarding → profile
    if (profileCompleted) {
      router.replace("/profile");
    }
  }, [user, profileCompleted, loading, router]);

  if (loading || (!user && !openAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking onboarding status…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <OnboardingProfile />

      <AuthModal
        open={openAuth}
        onClose={() => setOpenAuth(false)}
      />
    </main>
  );
}