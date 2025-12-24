"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import CreateActivityForm from "@/components/activity/CreateActivityForm";

export default function CreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/");
      } else {
        setUserId(data.user.id);
      }
    });
  }, [router]);

  if (!userId) return null;

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <CreateActivityForm userId={userId} />
    </main>
  );
}