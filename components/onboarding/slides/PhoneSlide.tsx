type PhoneSlideProps = {
  countryCode: string;
  phone: string;
  error?: string; // 👈 ADD THIS
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
};

export default function PhoneSlide({
  countryCode,
  phone,
  error,
  onCountryCodeChange,
  onPhoneChange,
}: PhoneSlideProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        What’s your phone number?
      </h2>

      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="rounded-xl border border-orange-200 bg-orange-50/40 px-2 py-2 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none"
        >
          <option value="+91">+91 IN</option>
          <option value="+1">+1 US</option>
          <option value="+44">+44 UK</option>
        </select>

        <input
          type="tel"
          placeholder="10-digit number"
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length <= 10) onPhoneChange(digits);
          }}
          className="flex-1 rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none"
        />
      </div>

      {phone.length > 0 && phone.length < 10 && (
        <p className="text-xs text-red-500 mt-2">
          Phone number must be exactly 10 digits
        </p>
      )}

      <p className="mt-2 text-xs text-slate-500">Your phone number is used only for verification and is never shown publicly.</p>
      
      {error && (
        <p className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}

    </div>
  );
}