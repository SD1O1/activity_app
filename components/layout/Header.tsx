"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthButtons from "../auth/AuthButtons";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // initial check
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
        {/* LEFT */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-xl"
        >
          ☰
        </button>

        {/* CENTER */}
        <div className="text-sm font-semibold">
          PerfectBench
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button onClick={() => router.push("/notifications")}>
              🔔
            </button>
          ) : (
            <AuthButtons />
          )}
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}