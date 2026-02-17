"use client";

type PhotoSlideProps = {
  value: string | null;
  onSelectFile: (file: File) => void;
  uploading?: boolean;
  error?: string | null;
};

export default function PhotoSlide({
  value,
  onSelectFile,
  uploading = false,
  error,
}: PhotoSlideProps) {
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

      <label
        className={`text-sm font-semibold underline cursor-pointer ${
          uploading ? "text-gray-400 cursor-not-allowed" : "text-black"
        }`}
      >
        {uploading ? "Uploading photo…" : "Add photo"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectFile(file);
            e.currentTarget.value = "";
          }}
        />
      </label>

      {uploading && (
        <p className="mt-2 text-xs text-gray-500" role="status" aria-live="polite">
          Please wait while we upload your photo.
        </p>
      )}

      {error ? (
        <p className="mt-2 text-xs text-red-600 text-center" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}