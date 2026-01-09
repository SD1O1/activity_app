"use client";

type BioSlideProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function BioSlide({ value, onChange }: BioSlideProps) {
  return (
    <div className="w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-2 text-center">
        Tell us a bit about yourself
      </h2>

      <textarea
        rows={4}
        placeholder="Your bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 text-sm resize-none"
      />
    </div>
  );
}