"use client";

type HomeActionsProps = {
  onOpenSearch: () => void;
};

export default function HomeActions({ onOpenSearch }: HomeActionsProps) {
  return (
    <section className="px-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onOpenSearch}
          className="rounded-xl bg-black py-4 text-white font-medium"
        >
          🔍 Find an Activity
        </button>

        <button className="rounded-xl border py-4 font-medium">
          ➕ Create Activity
        </button>
      </div>
    </section>
  );
}