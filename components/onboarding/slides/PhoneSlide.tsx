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
    <div className="w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-4">
        What’s your phone number?
      </h2>

      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="border rounded px-2 py-2 text-sm"
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
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
      </div>

      {phone.length > 0 && phone.length < 10 && (
        <p className="text-xs text-red-500 mt-2">
          Phone number must be exactly 10 digits
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-2">
          {error}
        </p>
      )}

    </div>
  );
}