"use client";

import { useRouter } from "next/navigation";


type HomeActionsProps = {
  onOpenSearch: () => void;
};

export default function HomeActions({ onOpenSearch }: HomeActionsProps) {
  const router = useRouter();
  
  return (
    <section className="px-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onOpenSearch}
          className="rounded-xl bg-black py-4 text-white font-medium"
        >
          🔍 Find an Activity
        </button>

        <button 
          onClick={() => router.push("/create")}
          className="rounded-xl border py-4 font-medium">
          ➕ Create Activity
        </button>
      </div>
    </section>
  );
}