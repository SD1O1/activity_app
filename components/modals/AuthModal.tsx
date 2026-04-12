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

  const handleOAuth = async (provider: "google") => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-6 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.6)] sm:p-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          {mode === "login" ? "Log in to your account" : "Create your account"}
        </h2>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#f97316] bg-orange-50/40 px-4 py-3 font-semibold text-[#f97316] shadow-sm transition-all duration-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
          >
            <span>G</span>
            Continue with Google
          </button>
        </div>

        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-orange-100" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">or continue with email</span>
          </div>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        />

        {mode === "signup" && !isPasswordValid && <p className="mt-2 text-sm text-slate-500">Password must be at least 8 characters</p>}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {info && <p className="mt-2 text-sm text-green-600">{info}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password || (mode === "signup" && !isPasswordValid)}
          className="mt-6 w-full rounded-2xl border border-[#f97316] bg-[#f97316] py-4 text-base font-bold text-white shadow-[0_18px_30px_-20px_rgba(249,115,22,0.8)] transition-all duration-200 hover:bg-[#ea6a11] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div className="mt-7 flex flex-col items-center gap-3 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="block text-sm text-slate-600"
          >
            {mode === "login" ? "New here? " : "Already have an account? "}
            <span className="font-semibold text-[#f97316]">{mode === "login" ? "Create an account" : "Log in"}</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-full border border-orange-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}