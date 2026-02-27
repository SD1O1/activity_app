"use client";

import { useRouter } from "next/navigation";

type HomeActionsProps = {
  onOpenSearch: () => void;
  user: { id?: string } | null;
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
    <section className="px-5 mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button onClick={onOpenSearch} className="rounded-3xl bg-[#0d1b42] py-5 text-white">
          <div className="text-3xl">🔍</div>
          <div className="mt-2 text-2xl font-semibold">Find an Activity</div>
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-3xl border-2 border-[#f97316] bg-white py-5 text-[#111827] disabled:opacity-50"
        >
          <div className="text-3xl text-[#f97316]">＋</div>
          <div className="mt-2 text-2xl font-semibold">Create Activity</div>
        </button>
      </div>
    </section>
  );
}