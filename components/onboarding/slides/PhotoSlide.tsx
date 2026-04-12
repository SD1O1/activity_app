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
    <div className="w-full max-w-sm rounded-3xl border border-orange-100/80 bg-white p-5 text-center shadow-[0_16px_30px_-26px_rgba(15,23,42,0.45)]">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Add a profile photo
      </h2>

      <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-2 border-orange-100 bg-orange-50">
        {value ? (
          <img
            src={value}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No photo
          </div>
        )}
      </div>

      <label
        className={`text-sm font-semibold underline cursor-pointer ${
          uploading ? "text-slate-400 cursor-not-allowed" : "text-[#f97316]"
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
        <p className="mt-2 text-xs text-slate-500" role="status" aria-live="polite">
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