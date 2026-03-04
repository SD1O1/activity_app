"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const isPasswordValid = password.length >= 8;

  const buildSignupMetadata = () => {
    const emailPrefix = email.split("@")[0]?.trim() || "new_user";
    const normalizedBase = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fallbackName = normalizedBase || "new_user";

    const usernameSuffix = Math.random().toString(36).slice(2, 8);
    const fallbackUsername = `${fallbackName}_${usernameSuffix}`;

    return {
      name: fallbackName,
      full_name: fallbackName,
      username: fallbackUsername,
    };
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const { data, error: authError } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          })
        : await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: buildSignupMetadata(),
            },
          });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup" && data.user) {
      showToast("Account created. Let's finish your profile.", "success");
      onClose();
      router.replace("/onboarding/profile");
      return;
    }

    showToast("Logged in successfully", "success");
    onClose();
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    setError(null);
    setInfo(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/onboarding/profile`,
      },
    });

    setLoading(false);

    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-2xl sm:p-8">
        <h2 className="text-center text-xl font-bold text-gray-900">
          {mode === "login" ? "Log in to your account" : "Create your account"}
        </h2>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#ff5c00] px-4 py-3 font-semibold text-[#ff5c00] transition hover:bg-[#ff5c00]/5 disabled:opacity-60"
          >
            <span>G</span>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth("facebook")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#ff5c00] px-4 py-3 font-semibold text-[#ff5c00] transition hover:bg-[#ff5c00]/5 disabled:opacity-60"
          >
            <span>f</span>
            Continue with Facebook / Instagram
          </button>
        </div>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or continue with email</span>
          </div>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#ff5c00] focus:ring-[#ff5c00]"
        />

        <p className="mt-2 px-1 text-xs leading-relaxed text-gray-500">
          Your email is private and used only for login and account recovery.
        </p>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#ff5c00] focus:ring-[#ff5c00]"
        />

        {mode === "signup" && !isPasswordValid && <p className="mt-2 text-sm text-gray-500">Password must be at least 8 characters</p>}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {info && <p className="mt-2 text-sm text-green-600">{info}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password || (mode === "signup" && !isPasswordValid)}
          className="mt-6 w-full rounded-xl bg-[#ff5c00] py-4 font-bold text-white shadow-lg shadow-orange-500/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div className="mt-7 space-y-3 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="text-sm text-gray-600"
          >
            {mode === "login" ? "New here? " : "Already have an account? "}
            <span className="font-semibold text-[#ff5c00]">{mode === "login" ? "Create an account" : "Log in"}</span>
          </button>

          <button onClick={onClose} className="text-sm font-medium text-gray-400 transition hover:text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
