"use client";

import { supabase } from "@/lib/supabaseClient";

export default function AuthButtons() {
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign-out error:", error.message);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={signIn}
        className="px-4 py-2 border rounded"
      >
        Login
      </button>

      <button
        onClick={signOut}
        className="px-4 py-2 border rounded"
      >
        Logout
      </button>
    </div>
  );
}