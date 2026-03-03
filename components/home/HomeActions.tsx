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

export default function HomeActions({
  onOpenSearch,
  user,
  profileCompleted,
  loading,
  openAuthModal,
}: HomeActionsProps) {
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
    <section className="mt-8 px-4 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={onOpenSearch}
          className="rounded-3xl bg-slate-950 px-6 py-8 text-left text-white shadow"
        >
          <div className="text-4xl">🔎</div>
          <p className="mt-3 text-2xl font-semibold">FIND ACTIVITY</p>
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-3xl border border-neutral-200 bg-white px-6 py-8 text-left shadow-sm disabled:opacity-60"
        >
          <div className="text-4xl text-amber-500">＋</div>
          <p className="mt-3 text-2xl font-semibold text-neutral-900">CREATE ACTIVITY</p>
        </button>
      </div>
    </section>
  );
}
