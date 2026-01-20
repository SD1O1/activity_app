"use client";

import { useEffect, useState } from "react";

type Props = {
  phone: string; // full phone: +919090909090
  phoneVerified: boolean;
  error?: string;
  onChange: (phone: string) => void;
  onVerified: () => void;
};

const COUNTRY_OPTIONS = [
  { code: "+91", label: "IN" },
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
];

export default function PhoneVerificationSection({
  phone,
  phoneVerified,
  error,
  onChange,
  onVerified,
}: Props) {
  const [originalPhone, setOriginalPhone] = useState(phone);
  const [countryCode, setCountryCode] = useState("+91");
  const [localPhone, setLocalPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  /* ---------------- init from full phone ---------------- */
  useEffect(() => {
    setOriginalPhone(phone);

    if (!phone) return;

    const match = COUNTRY_OPTIONS.find(opt =>
      phone.startsWith(opt.code)
    );

    if (match) {
      setCountryCode(match.code);
      setLocalPhone(phone.replace(match.code, ""));
    }
  }, []);

  /* ---------------- helpers ---------------- */
  const fullPhone = `${countryCode}${localPhone}`;
  const phoneChanged = fullPhone !== originalPhone;

  const isInvalidNumber =
    localPhone.length >= 0 && localPhone.length !== 10;

  /* ---------------- render ---------------- */
  return (
    <div className="mt-6 space-y-2">
      <label className="text-xs font-medium text-gray-600">
        Phone number
      </label>

      {/* Phone input row */}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            onChange(`${e.target.value}${localPhone}`);
          }}
          className="border rounded px-2 py-2 text-sm"
        >
          {COUNTRY_OPTIONS.map(opt => (
            <option key={opt.code} value={opt.code}>
              {opt.code} {opt.label}
            </option>
          ))}
        </select>

        <input
          type="tel"
          placeholder="10-digit number"
          value={localPhone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length <= 10) {
              setLocalPhone(digits);
              onChange(`${countryCode}${digits}`);
            }
          }}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Invalid number warning */}
      {isInvalidNumber && (
        <p className="text-xs text-red-600">
          Phone number must be exactly 10 digits
        </p>
      )}

      {/* Not verified warning (only if valid) */}
      {phoneChanged && !phoneVerified && !isInvalidNumber && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-red-600">
            Phone number not verified
          </p>

          {!showOtp ? (
            <button
              onClick={() => {
                console.log("OTP sent to", fullPhone);
                setShowOtp(true);
              }}
              className="text-sm font-semibold underline"
            >
              Send OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />

              {error && (
                <p className="text-xs text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={() => {
                  if (otp.length < 4) {
                    alert("Invalid OTP");
                    return;
                  }

                  onVerified();
                  setShowOtp(false);
                  setOtp("");
                }}
                className="text-sm font-semibold"
              >
                Verify OTP
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}