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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-neutral-100 p-6 shadow-2xl">
        <h2 className="text-center text-5xl font-semibold tracking-tight text-slate-900">
          {mode === "login" ? "Log in to your account" : "Create your account"}
        </h2>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full rounded-full border-4 border-amber-500 bg-white py-3 text-2xl font-semibold text-amber-600 disabled:opacity-60"
          >
            G Continue with Google
          </button>

          <button
            onClick={() => handleOAuth("facebook")}
            disabled={loading}
            className="w-full rounded-[1.75rem] border-4 border-amber-500 bg-white py-3 text-2xl font-semibold text-amber-600 disabled:opacity-60"
          >
            f Continue with Facebook / Instagram
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-neutral-500">
          <span className="h-px flex-1 bg-neutral-300" />
          <span className="text-xl">or continue with email</span>
          <span className="h-px flex-1 bg-neutral-300" />
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-neutral-300 bg-white px-5 py-3 text-2xl text-neutral-700"
        />

        <p className="mt-3 text-lg text-neutral-500">
          Your email is private and used only for login and account recovery.
        </p>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-full border border-neutral-300 bg-white px-5 py-3 text-2xl text-neutral-700"
        />

        {mode === "signup" && !isPasswordValid && (
          <p className="mt-2 text-sm text-neutral-500">Password must be at least 8 characters</p>
        )}

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {info && <p className="mt-2 text-sm text-green-600">{info}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password || (mode === "signup" && !isPasswordValid)}
          className="mt-5 w-full rounded-full bg-amber-500 py-4 text-3xl font-semibold text-white shadow disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setInfo(null);
          }}
          className="mt-5 w-full text-center text-2xl text-neutral-600"
        >
          {mode === "login" ? "New here? " : "Already have an account? "}
          <span className="font-semibold text-amber-600">{mode === "login" ? "Create an account" : "Log in"}</span>
        </button>

        <button onClick={onClose} className="mt-4 w-full text-center text-2xl text-neutral-400">
          Cancel
        </button>
      </div>
    </div>
  );
}
