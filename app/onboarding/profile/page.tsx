"use client";

import Header from "@/components/layout/Header";
import OnboardingProfile from "@/components/onboarding/OnboardingProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import AuthModal from "@/components/modals/AuthModal";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, profileCompleted, loading } = useClientAuthProfile();
  const shouldOpenAuth = !loading && !user;

  useEffect(() => {
    if (!loading && user && profileCompleted) {
      router.replace("/profile");
    }
  }, [user, profileCompleted, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking onboarding status…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      {user ? <OnboardingProfile /> : null}
      <AuthModal open={shouldOpenAuth} onClose={() => router.push("/")} />
    </main>
  );
}
