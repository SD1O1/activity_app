"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PasswordSecuritySection() {
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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
              if (password !== confirm) {
                setMessage("Passwords do not match");
                return;
              }

              const { error } =
                await supabase.auth.updateUser({
                  password,
                });

              setMessage(
                error
                  ? error.message
                  : "Password updated successfully"
              );
            }}
            className="mt-2 text-sm font-semibold"
          >
            Update password
          </button>
        </div>
      )}
    </div>
  );
}