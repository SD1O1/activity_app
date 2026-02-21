"use client";

type PhoneOtpSlideProps = {
  otp: string;
  onChange: (otp: string) => void;
  onVerify: () => void;
  loading: boolean;
  error?: string | null;
};

export default function PhoneOtpSlide({
  otp,
  onChange,
  onVerify,
  loading,
  error,
}: PhoneOtpSlideProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2 text-center">
        Enter verification code
      </h2>

      <p className="text-sm text-gray-500 text-center mb-4">
        We sent a code to your phone
      </p>

      <input
        type="text"
        placeholder="6-digit code"
        value={otp}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 text-sm mb-4"
      />

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}

      <button
        onClick={onVerify}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg text-sm font-semibold"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}