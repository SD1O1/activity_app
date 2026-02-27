"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthModal from "@/components/modals/AuthModal";
import { supabase } from "@/lib/supabaseClient";
import { useNotifications } from "@/components/notifications/NotificationContext";

type HeaderProps = {
  rightSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  className?: string;
};

export default function Header({ rightSlot, centerSlot, className = "" }: HeaderProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <header className={`h-16 border-b border-[#e3e6ea] flex items-center justify-between px-5 bg-[#f4f4f4] ${className}`}>
        <button onClick={() => setSidebarOpen(true)} className="text-2xl text-[#334155]">
          ☰
        </button>

        <div className="text-sm font-semibold text-[#111827]">{centerSlot ?? "PerfectBench"}</div>

        <div className="flex min-w-[32px] justify-end items-center gap-3">
          {rightSlot ? (
            rightSlot
          ) : (
            <>
              {!isLoggedIn && (
                <button onClick={() => setOpenAuth(true)} className="text-sm border px-3 py-1 rounded">
                  Login
                </button>
              )}

              {isLoggedIn && (
                <button onClick={() => router.push("/notifications")} className="relative text-xl" aria-label="Notifications">
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isLoggedIn={isLoggedIn} />

      <AuthModal open={openAuth} onClose={() => setOpenAuth(false)} />
    </>
  );
}