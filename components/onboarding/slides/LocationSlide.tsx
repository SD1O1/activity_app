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
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold mb-2 text-center">
        Where are you located?
      </h2>

      <p className="mb-4 text-center text-sm text-slate-500">
        This helps us show activities near you
      </p>

      <button
        onClick={onUseLocation}
        className="mb-4 w-full rounded-2xl border border-orange-200 bg-orange-50/70 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        Use my current location
      </button>

      <div className="w-full">
        <input
          type="text"
          placeholder="Enter your city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-sm text-slate-700 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>
    </div>
  );
}