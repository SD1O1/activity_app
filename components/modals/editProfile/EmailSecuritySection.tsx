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
        className="text-sm font-medium"
      >
        Change email
      </button>

      {show && (
        <div className="mt-2">
          <input
            type="email"
            placeholder="New email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
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

              setSubmitting(true);

              const { error } = await supabase.auth.updateUser({
                email: trimmedEmail,
              });

              setSubmitting(false);

              setMessage(
                error
                  ? error.message
                  : "Confirmation email sent. Check your inbox to finish the change."
              );
            }}
            disabled={submitting}
            className="mt-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update email"}
          </button>
        </div>
      )}
    </div>
  );
}