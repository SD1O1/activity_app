"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const isPasswordValid = password.length >= 8;

  /* -------------------- email auth -------------------- */
  const handleEmailAuth = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const { data, error } =
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

    // ✅ NEW: redirect immediately after signup
    if (mode === "signup" && data.user) {
      onClose();
      router.replace("/onboarding/profile");
      return;
    }

    // login success
    onClose();
  };

  /* -------------------- social auth -------------------- */
  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/onboarding/profile`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    }
  };

  /* -------------------- render -------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold mb-4 text-center">
          {mode === "login" ? "Log in to your account" : "Create an account"}
        </h2>

        {/* ---------- social auth ---------- */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full rounded-lg border py-2 text-sm font-medium"
          >
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth("facebook")}
            disabled={loading}
            className="w-full rounded-lg border py-2 text-sm font-medium"
          >
            Continue with Facebook / Instagram
          </button>
        </div>

        <div className="my-4 text-center text-xs text-gray-400">
          or continue with email
        </div>

        {/* ---------- email auth ---------- */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-3 text-sm"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 mb-2 text-sm"
        />

        {mode === "signup" && !isPasswordValid && (
          <p className="text-xs text-gray-500 mb-2">
            Password must be at least 8 characters
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500 mb-2">{error}</p>
        )}

        {info && (
          <p className="text-sm text-green-600 mb-2">{info}</p>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={
            loading ||
            !email ||
            !password ||
            (mode === "signup" && !isPasswordValid)
          }
          className="w-full rounded-lg bg-black py-2 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Log In"
            : "Create Account"}
        </button>

        {/* ---------- switch mode ---------- */}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="mt-3 text-sm text-gray-600"
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>

        <button
          onClick={onClose}
          className="mt-4 block w-full text-center text-sm text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}