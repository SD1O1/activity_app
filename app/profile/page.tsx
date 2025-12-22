"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white relative">
      {/* Top bar */}
      <Header />

      {/* Profile header */}
      <section className="flex flex-col items-center px-4 py-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gray-300" />
          <span className="absolute bottom-0 right-0 bg-black text-white text-xs px-2 py-0.5 rounded-full">
            ✓
          </span>
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          Rahul, 27
        </h2>

        <p className="mt-1 text-sm text-gray-600 text-center">
          Enjoys deep conversations, walks, and coffee.
        </p>
      </section>

      {/* Interests */}
      <section className="px-4">
        <h3 className="text-sm font-semibold mb-2">
          Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Coffee", "Walks", "Gym", "Startups"].map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs"
            >
              {interest}
            </span>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-2">
          Activities
        </h3>

        <div className="space-y-3 text-sm text-gray-600">
          <div>☕ Coffee Walk — Today, 6 PM</div>
          <div>🚶 Morning Walk — Tomorrow, 7 AM</div>
        </div>
      </section>

      {/* Floating action button */}
      <button
        onClick={() => console.log("Create activity")}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-black text-white text-2xl flex items-center justify-center"
      >
        +
      </button>
    </main>
  );
}