"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type NotificationContextType = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  clearUnreadCount: () => void;
};

const NotificationContext =
  createContext<NotificationContextType | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  /* ------------------------------
     REFRESH COUNT
  ------------------------------ */
  const refreshUnreadCount = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  /* ------------------------------
     INIT + REALTIME
  ------------------------------ */
  useEffect(() => {
    let channel: any;

    const setup = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setUnreadCount(0);
        return;
      }

      // initial load
      await refreshUnreadCount();

      // realtime notifications
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refreshUnreadCount();
          }
        )
        .subscribe();
    };

    setup();

    // auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await refreshUnreadCount();
        } else {
          setUnreadCount(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        clearUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }
  return ctx;
}