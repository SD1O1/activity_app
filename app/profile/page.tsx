"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/layout/Header";
import ProfileView from "@/components/profile/ProfileView";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ProfileView />
    </main>
  );
}