"use client";

import { useEffect, useState } from "react";

type Props = {
  phone: string;
  phoneVerified: boolean;
  onChange: (phone: string) => void;
  onVerified: () => void;
};

export default function PhoneVerificationSection({
  phone,
  phoneVerified,
  onChange,
  onVerified,
}: Props) {
  const [originalPhone, setOriginalPhone] = useState(phone);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    setOriginalPhone(phone);
  }, []);

  const phoneChanged = phone !== originalPhone;

  return (
    <div className="mt-4">
      <input
        type="tel"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      {phoneChanged && !phoneVerified && (
        <div className="mt-2">
          <p className="text-xs text-red-600">
            Phone number not verified
          </p>

          {!showOtp ? (
            <button
              onClick={() => {
                console.log("OTP sent to", phone);
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
                className="mt-2 w-full border rounded px-3 py-2 text-sm"
              />

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
                className="mt-2 text-sm font-semibold"
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