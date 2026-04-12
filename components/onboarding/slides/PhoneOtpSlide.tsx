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
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold mb-2 text-center">
        Enter verification code
      </h2>

      <p className="mb-4 text-center text-sm text-slate-500">
        We sent a code to your phone
      </p>

      <input
        type="text"
        placeholder="6-digit code"
        value={otp}
        onChange={(e) => onChange(e.target.value)}
        className="mb-4 w-full rounded-2xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
      />

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}

      <button
        onClick={onVerify}
        disabled={loading}
        className="w-full rounded-2xl bg-[#f97316] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:bg-orange-100 disabled:text-slate-400"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}