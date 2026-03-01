"use client";

import { useRouter } from "next/navigation";

type HomeActionsProps = {
  onOpenSearch: () => void;
  user: { id?: string } | null;
  profileCompleted: boolean;
  loading: boolean;
  openAuthModal: () => void;
};

export default function HomeActions({ onOpenSearch, user, profileCompleted, loading, openAuthModal }: HomeActionsProps) {
  const router = useRouter();

  const handleCreate = () => {
    if (loading) return;
    if (!user) return openAuthModal();
    if (!profileCompleted) return router.push("/onboarding/profile");
    router.push("/create");
  };

  return (
    <section className="pt-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={onOpenSearch}
          className="app-card p-5 text-[#111827] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
        >
          <div className="text-2xl">🔍</div>
          <div className="mt-3 text-[16px] font-semibold">Find Activity</div>
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="app-card p-5 text-[#111827] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.14)] disabled:opacity-50"
        >
          <div className="text-2xl text-[#f97316]">＋</div>
          <div className="mt-3 text-[16px] font-semibold">Create Activity</div>
        </button>
      </div>
    </section>
  );
}
