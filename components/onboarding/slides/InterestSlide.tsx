"use client";

type InterestSlideProps = {
  value: string[];
  onChange: (interests: string[]) => void;
};

const INTEREST_OPTIONS = [
  "Coffee",
  "Fitness",
  "Gym",
  "Walking",
  "Running",
  "Startups",
  "Tech",
  "Reading",
  "Writing",
  "Music",
  "Movies",
  "Photography",
  "Travel",
  "Food",
  "Cooking",
  "Meditation",
  "Yoga",
  "Art",
  "Design",
  "Networking",
  "Entrepreneurship",
  "Nature",
  "Cycling",
  "Gaming",
];

const MIN = 5;
const MAX = 10;

export default function InterestSlide({
  value,
  onChange,
}: InterestSlideProps) {
  const toggleInterest = (interest: string) => {
    if (value.includes(interest)) {
      onChange(value.filter((i) => i !== interest));
    } else {
      if (value.length >= MAX) return;
      onChange([...value, interest]);
    }
  };

  const isValid = value.length >= MIN && value.length <= MAX;

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold mb-1 text-center">
        Select your interests
      </h2>

      <p className="mb-4 text-center text-sm text-slate-500">
        Choose {MIN}–{MAX} interests that describe you
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {INTEREST_OPTIONS.map((interest) => {
          const selected = value.includes(interest);

          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm border transition
                ${
                  selected
                    ? "bg-[#f97316] text-white border-[#f97316]"
                    : "bg-orange-50/50 text-slate-700 border-orange-200 hover:bg-orange-100"
                }
              `}
            >
              {interest}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p
          className={`text-xs ${
            isValid ? "text-green-600" : "text-slate-500"
          }`}
        >
          {value.length} selected
        </p>

        {!isValid && (
          <p className="text-xs text-red-500 mt-1">
            Select at least {MIN} and up to {MAX} interests
          </p>
        )}
      </div>
    </div>
  );
}