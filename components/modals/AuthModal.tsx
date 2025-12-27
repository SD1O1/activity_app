"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onClose(); // success
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-3"
        />

        {error && (
          <p className="text-sm text-red-500 mb-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-black py-2 text-white"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Log In"
            : "Create Account"}
        </button>

        <button
          onClick={() =>
            setMode(mode === "login" ? "signup" : "login")
          }
          className="mt-3 text-sm text-gray-600"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}