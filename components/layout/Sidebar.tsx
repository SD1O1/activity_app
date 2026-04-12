"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
};

export default function Sidebar({ open, onClose, isLoggedIn }: SidebarProps) {
  const router = useRouter();

  if (!open) return null;

  const logout = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      console.error("logout failed", error);
    }
    onClose();
    router.push("/");
  };

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* SIDEBAR */}
      <div className="flex w-72 flex-col border-r border-orange-100/80 bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] p-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Menu</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <ul className="flex-1 space-y-2">
          <li
            className="cursor-pointer rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
            onClick={() => navigate("/")}
          >
            Home
          </li>

          <li
            className="cursor-pointer rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
            onClick={() => navigate("/activities")}
          >
            Activities
          </li>

          {isLoggedIn && (
            <>
              <li
                className="cursor-pointer rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50"
                onClick={() => navigate("/profile")}
              >
                Profile
              </li>

              <li
                className="cursor-pointer rounded-2xl border border-transparent px-3 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:border-red-100 hover:bg-red-50"
                onClick={logout}
              >
                Logout
              </li>
            </>
          )}
        </ul>

        {/* THEME TOGGLE */}
        <div className="border-t border-orange-100/80 pt-4">
          <ThemeToggle />
        </div>
      </div>

      {/* OVERLAY */}
      <div
        className="flex-1 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
    </div>
  );
}