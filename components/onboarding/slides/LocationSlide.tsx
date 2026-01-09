"use client";

type LocationSlideProps = {
  city: string;
  onCityChange: (city: string) => void;
  onUseLocation: () => void;
};

export default function LocationSlide({
  city,
  onCityChange,
  onUseLocation,
}: LocationSlideProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2 text-center">
        Where are you located?
      </h2>

      <p className="text-sm text-gray-500 text-center mb-4">
        This helps us show activities near you
      </p>

      <button
        onClick={onUseLocation}
        className="w-full mb-4 border rounded-lg py-3 text-sm font-semibold"
      >
        Use my current location
      </button>

      <div className="w-full">
        <input
          type="text"
          placeholder="Enter your city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm"
        />
      </div>
    </div>
  );
}