"use client";

import { useRouter } from "next/navigation";

type HomeActionsProps = {
  onOpenSearch: () => void;
  user: any | null;
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
    <section className="px-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onOpenSearch}
          className="rounded-xl bg-black py-4 text-white font-medium"
        >
          🔍 Find an Activity
        </button>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="rounded-xl border py-4 font-medium disabled:opacity-50"
        >
          ➕ Create Activity
        </button>
      </div>
    </section>
  );
}