"use client";

type DobSlideProps = {
  value: string;
  onChange: (dob: string) => void;
};

export default function DobSlide({ value, onChange }: DobSlideProps) {
  return (
    <div className="w-full max-w-sm text-center">
      <h2 className="text-lg font-semibold mb-2">
        What’s your date of birth?
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        This helps us show your correct age.
        <br />
        <span className="text-xs text-gray-400">
          This can’t be changed later.
        </span>
      </p>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
        max={new Date().toISOString().split("T")[0]}
      />
    </div>
  );
}