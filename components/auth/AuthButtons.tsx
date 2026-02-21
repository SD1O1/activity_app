"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthButtons() {
  const [loggedIn, setLoggedIn] = useState(false);

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

  if (!loggedIn) {
    return (
      <button
        onClick={() => alert("Auth modal will open here")}
        className="px-4 py-2 border"
      >
        Login
      </button>
    );
  }

  return (
    <button
    onClick={async () => {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        console.error("logout failed", error);
      }
    }}
      className="px-4 py-2 border"
    >
      Logout
    </button>
  );
}