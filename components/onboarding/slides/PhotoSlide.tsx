"use client";

type PhotoSlideProps = {
  value: string | null;
  onSelectFile: (file: File) => void;
};

export default function PhotoSlide({ value, onSelectFile }: PhotoSlideProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Add a profile photo
      </h2>

      <div className="h-32 w-32 rounded-full bg-gray-200 overflow-hidden mb-4">
        {value ? (
          <img
            src={value}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>

      <label className="text-sm font-semibold text-black underline cursor-pointer">
        Add photo
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectFile(file);
          }}
        />
      </label>
    </div>
  );
}