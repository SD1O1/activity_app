"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export function useClientAuthProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (!user) {
        setProfileCompleted(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("dob, phone_verified")
        .eq("id", user.id)
        .single();

      const completed =
        !!data?.dob && data?.phone_verified === true;

      setProfileCompleted(completed);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    profileCompleted,
    loading,
  };
}