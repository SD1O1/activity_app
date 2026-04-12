"use client";

import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type HomeActionsProps = {
  onOpenSearch: () => void;
  user: User | null;
  profileCompleted: boolean;
  loading: boolean;
  openAuthModal: () => void;
};

export default function HomeActions({ onOpenSearch, user, profileCompleted, loading, openAuthModal }: HomeActionsProps) {
  const router = useRouter();

  const handleCreate = () => {
    if (loading) return;

    if (!user) {
      openAuthModal();
      return;
    }

    if (!profileCompleted) {
      router.push("/onboarding/profile");
      return;
    }

    router.push("/create");
  };

  return (
    <section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={onOpenSearch}
          className="rounded-3xl bg-gradient-to-br from-[#ff8a3d] to-[#f97316] px-6 py-8 text-center text-white shadow-lg shadow-orange-200/60 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="text-4xl">🔎</div>
          <p className="mt-3 text-2xl font-bold tracking-wide">FIND ACTIVITY</p>
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-3xl border-2 border-orange-200 bg-orange-50/40 px-6 py-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-300 active:scale-[0.98] disabled:opacity-60"
        >
          <div className="text-4xl text-[#f97316]">＋</div>
          <p className="mt-3 text-2xl font-bold text-neutral-900">CREATE ACTIVITY</p>
        </button>
      </div>
    </section>
  );
}
