"use client";

type NameSlideProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function NameSlide({ value, onChange }: NameSlideProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="mb-2 text-center text-lg font-semibold text-slate-900">
        What’s your name?
      </h2>

      <input
        autoFocus
        type="text"
        placeholder="Enter your name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}