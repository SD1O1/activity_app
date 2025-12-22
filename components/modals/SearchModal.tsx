"use client";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SearchModal({
  open,
  onClose,
}: SearchModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <input
          autoFocus
          placeholder="What do you want to do?"
          className="flex-1 mr-3 rounded-xl border px-4 py-2 outline-none"
        />

        <button
          onClick={onClose}
          className="text-xl"
        >
          ✕
        </button>
      </div>

      {/* Suggested / Nearby */}
      <div className="px-4 py-4">
        <h3 className="text-sm font-semibold mb-3">
          Suggested
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Nearby</span>
            <span className="text-gray-400">→</span>
          </div>

          <div>Coffee</div>
          <div>Walk</div>
          <div>Gym</div>
          <div>Work</div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-3">
          Filters
        </h3>

        {/* Time */}
        <div className="mb-4">
          <label className="text-xs text-gray-500">
            Time
          </label>
          <select className="mt-1 w-full rounded-xl border px-4 py-2">
            <option>Anytime</option>
            <option>Today</option>
            <option>Tomorrow</option>
            <option>Weekend</option>
          </select>
        </div>

        {/* Distance */}
        <div>
          <label className="text-xs text-gray-500">
            Distance (km)
          </label>
          <input
            type="range"
            min={1}
            max={50}
            className="w-full mt-2"
          />
        </div>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white">
        <button className="w-full rounded-xl bg-black py-3 text-white font-medium">
          Search
        </button>
      </div>
    </div>
  );
}