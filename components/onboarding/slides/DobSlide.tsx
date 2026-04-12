"use client";

import { getAge } from "@/lib/getAge";

type DobSlideProps = {
  value: string;
  onChange: (dob: string) => void;
};

export default function DobSlide({ value, onChange }: DobSlideProps) {
  
  const age = getAge(value);
  const isMinor = age !== null && age < 18;

  return (
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 text-center shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold mb-2">
        What’s your date of birth?
      </h2>

      <p className="mb-4 text-sm text-slate-500">
        This helps us show your correct age.
        <br />
        <span className="text-xs text-slate-400">
          We only show your age to others, not your full birth date.
        </span>
      </p>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-orange-200 bg-orange-50/40 px-3 py-2 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        max={new Date().toISOString().split("T")[0]}
      />
      
      {isMinor && (
        <p className="mt-3 text-sm text-red-600">
          You must be at least 18 years old to use this app.
        </p>
      )}

    </div>
  );
}