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
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone number</label>

<div className="flex gap-2">
  <select
    value={countryCode}
    onChange={(e) => {
      setCountryCode(e.target.value);
      onChange(`${e.target.value}${localPhone}`);
    }}
    className="rounded-xl border border-orange-200 bg-orange-50/45 px-2 py-2 text-sm text-slate-700 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
    className="flex-1 rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
  />
</div>

{isInvalidNumber && <p className="text-xs text-red-600">Phone number must be exactly 10 digits</p>}

<p className="text-xs text-slate-500">Your phone number is used only for account verification and stays private.</p>

{phoneChanged && !phoneVerified && !isInvalidNumber && (
  <div className="mt-2 space-y-2">
    <p className="text-xs text-red-600">Phone number not verified</p>

    {!showOtp ? (
      <button
        onClick={() => {
          setShowOtp(true);
        }}
        className="text-sm font-semibold text-[#f97316] underline decoration-orange-300 underline-offset-2 transition-colors hover:text-[#ea6a11]"
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
          className="w-full rounded-xl border border-orange-200 bg-orange-50/45 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
          className="rounded-full border border-[#f97316] bg-[#f97316] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_14px_26px_-18px_rgba(249,115,22,0.85)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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