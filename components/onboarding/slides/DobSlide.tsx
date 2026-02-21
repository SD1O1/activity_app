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
    <div className="w-full max-w-sm text-center">
      <h2 className="text-lg font-semibold mb-2">
        What’s your date of birth?
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        This helps us show your correct age.
        <br />
        <span className="text-xs text-gray-400">
          We only show your age to others, not your full birth date.
        </span>
      </p>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
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