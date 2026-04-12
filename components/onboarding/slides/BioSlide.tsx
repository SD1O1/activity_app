"use client";

type BioSlideProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function BioSlide({ value, onChange }: BioSlideProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="mb-2 text-center text-lg font-semibold text-slate-900">
        Tell us a bit about yourself
      </h2>

      <textarea
        rows={4}
        placeholder="Your bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-2xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}