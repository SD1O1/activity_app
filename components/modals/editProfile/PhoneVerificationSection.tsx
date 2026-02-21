"use client";

import { useState } from "react";

type Props = {
  phone: string;
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

function getInitialPhoneParts(phone: string) {
  const match = COUNTRY_OPTIONS.find((opt) => phone.startsWith(opt.code));
  if (!match) return { countryCode: "+91", localPhone: "" };
  return { countryCode: match.code, localPhone: phone.replace(match.code, "") };
}

export default function PhoneVerificationSection({
  phone,
  phoneVerified,
  error,
  onChange,
  onVerified,
}: Props) {
  const initial = getInitialPhoneParts(phone);
  const [countryCode, setCountryCode] = useState(initial.countryCode);
  const [localPhone, setLocalPhone] = useState(initial.localPhone);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const fullPhone = `${countryCode}${localPhone}`;
  const phoneChanged = fullPhone !== phone;
  const isInvalidNumber = localPhone.length >= 0 && localPhone.length !== 10;

  return (
    <div className="mt-6 space-y-2">
      <label className="text-xs font-medium text-gray-600">Phone number</label>

      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            onChange(`${e.target.value}${localPhone}`);
          }}
          className="border rounded px-2 py-2 text-sm"
        >
          {COUNTRY_OPTIONS.map((opt) => (
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

      {isInvalidNumber && <p className="text-xs text-red-600">Phone number must be exactly 10 digits</p>}

      <p className="text-xs text-gray-500">Your phone number is used only for account verification and stays private.</p>

      {phoneChanged && !phoneVerified && !isInvalidNumber && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-red-600">Phone number not verified</p>

          {!showOtp ? (
            <button
              onClick={() => {
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

              {error ? <p className="text-xs text-red-600">{error}</p> : null}
              {otpError ? <p className="text-xs text-red-600">{otpError}</p> : null}

              <button
                onClick={() => {
                  if (otp.length < 4) {
                    setOtpError("Please enter a valid OTP code");
                    return;
                  }

                  setOtpError(null);
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