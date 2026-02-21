"use client";

import { useState } from "react";

export default function PasswordSecuritySection() {
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow((v) => !v)}
        className="text-sm font-medium"
      >
        Change password
      </button>

      {show && (
        <div className="mt-2">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm mb-2"
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />

          {message && (
            <p className="text-xs text-gray-600 mt-1">
              {message}
            </p>
          )}

          <button
            onClick={async () => {
              if (!password) {
                setMessage("Please enter a new password.");
                return;
              }

              if (password.length < 6) {
                setMessage("Password must be at least 6 characters.");
                return;
              }

              if (password !== confirm) {
                setMessage("Passwords do not match");
                return;
              }

              setSubmitting(true);

              const res = await fetch("/api/account/update-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const result = (await res.json()) as { error?: string };

              setSubmitting(false);

              setMessage(
                !res.ok
                  ? result.error || "Failed to update password"
                  : "Password updated successfully"
              );
            }}
            disabled={submitting}
            className="mt-2 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </div>
      )}
    </div>
  );
}