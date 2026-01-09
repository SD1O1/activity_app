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
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-lg font-semibold mb-1 text-center">
        Select your interests
      </h2>

      <p className="text-sm text-gray-500 text-center mb-4">
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
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300"
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
            isValid ? "text-green-600" : "text-gray-500"
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