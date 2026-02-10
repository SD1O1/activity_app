"use client";

import Header from "@/components/layout/Header";
import ProfileView from "@/components/profile/ProfileView";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthModal from "@/components/modals/AuthModal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profileCompleted, loading } = useClientAuthProfile();
  const shouldOpenAuth = !loading && !user;

  useEffect(() => {
    if (!loading && user && !profileCompleted) {
      router.replace("/onboarding/profile");
    }
  }, [user, profileCompleted, loading, router]);

  if (loading || !user || !profileCompleted) {
    return <AuthModal open={shouldOpenAuth} onClose={() => router.push("/")} />;
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ProfileView />
    </main>
  );
}
