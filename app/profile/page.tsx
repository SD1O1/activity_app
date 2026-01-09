"use client";

import Header from "@/components/layout/Header";
import ProfileView from "@/components/profile/ProfileView";
import { useClientAuthProfile } from "@/lib/useClientAuthProfile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthModal from "@/components/modals/AuthModal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profileCompleted, loading } = useClientAuthProfile();
  const [openAuth, setOpenAuth] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setOpenAuth(true);
      return;
    }

    if (!profileCompleted) {
      router.replace("/onboarding/profile");
    }
  }, [user, profileCompleted, loading, router]);

  if (loading || !user || !profileCompleted) {
    return (
      <>
        <AuthModal
          open={openAuth}
          onClose={() => setOpenAuth(false)}
        />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ProfileView />
    </main>
  );
}