"use client";

type NameSlideProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function NameSlide({ value, onChange }: NameSlideProps) {
  return (
    <div className="w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-2 text-center">
        What’s your name?
      </h2>

      <input
        autoFocus
        type="text"
        placeholder="Enter your name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 text-sm"
      />
    </div>
  );
}