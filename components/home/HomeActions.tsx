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
          className="app-card border border-gray-100 bg-white p-5 text-gray-900 transition-all duration-200 hover:shadow-md"
        >
          <div className="text-2xl">🔍</div>
          <div className="mt-3 text-[16px] font-semibold">Find Activity</div>
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="app-card border border-gray-100 bg-white p-5 text-gray-900 transition-all duration-200 hover:shadow-md disabled:opacity-50"
        >
          <div className="text-2xl text-orange-500">＋</div>
          <div className="mt-3 text-[16px] font-semibold">Create Activity</div>
        </button>
      </div>
    </section>
  );
}