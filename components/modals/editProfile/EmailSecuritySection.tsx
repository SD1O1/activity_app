"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EmailSecuritySection() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#f97316]"
      >
        Change email
      </button>

      {show && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-slate-500">Your email is private and only used for login and recovery.</p>
          <input
            type="email"
            placeholder="New email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          />

          {message && (
            <p className="text-xs text-gray-600 mt-1">
              {message}
            </p>
          )}

          <button
            onClick={async () => {
              const trimmedEmail = email.trim();
              if (!trimmedEmail) {
                setMessage("Please enter a new email.");
                return;
              }

              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                setMessage("You are not signed in. Please sign in again.");
                return;
              }

              if (user.email?.toLowerCase() === trimmedEmail.toLowerCase()) {
                setMessage("New email must be different from your current email.");
                return;
              }

              setSubmitting(true);

              const res = await fetch("/api/account/update-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail }),
              });
              const result = (await res.json()) as { error?: string; data?: unknown };

              setSubmitting(false);

              setMessage(
                !res.ok
                  ? result.error || "Failed to update email."
                  : "Confirmation email sent. Check your inbox to finish the change."
              );
            }}
            disabled={submitting}
            className="rounded-full border border-[#f97316] bg-[#f97316] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_14px_26px_-18px_rgba(249,115,22,0.85)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update email"}
          </button>
        </div>
      )}
    </div>
  );
}