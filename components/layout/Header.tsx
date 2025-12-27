"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthButtons from "../auth/AuthButtons";
import { supabase } from "@/lib/supabaseClient";
import AuthModal from "@/components/modals/AuthModal";


export default function Header() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
  
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) return;
  
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
  
      setUnreadCount(count || 0);
    };
  
    fetchUnreadCount();
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
          {!loggedIn && (
            <button
              onClick={() => setOpenAuth(true)}
              className="text-sm border px-3 py-1 rounded"
            >
              Login
            </button>
          )}

          {loggedIn && (
            <button
            onClick={() => router.push("/notifications")}
            className="relative"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>          
          )}
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
      />

      <AuthModal
        open={openAuth}
        onClose={() => setOpenAuth(false)}
      />
    </>
  );
}