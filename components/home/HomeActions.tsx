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
    <section className="px-4 pt-5">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onOpenSearch} className="app-card p-4 text-[#111827]">
          <div className="text-xl">🔍</div>
          <div className="mt-2 text-[14px] font-semibold">Find Activity</div>
        </button>

        <button onClick={handleCreate} disabled={loading} className="app-card p-4 text-[#111827] disabled:opacity-50">
          <div className="text-xl text-[#f97316]">＋</div>
          <div className="mt-2 text-[14px] font-semibold">Create Activity</div>
        </button>
      </div>
    </section>
  );
}
