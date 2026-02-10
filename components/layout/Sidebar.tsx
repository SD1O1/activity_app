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
    await supabase.auth.signOut();
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
      <div className="w-64 bg-card p-4 border-r border-border flex flex-col">
        <h3 className="font-semibold mb-6 text-text-primary">Menu</h3>

        <ul className="space-y-3 flex-1 text-text-secondary">
          <li
            className="cursor-pointer hover:text-text-primary"
            onClick={() => navigate("/")}
          >
            Home
          </li>

          <li
            className="cursor-pointer hover:text-text-primary"
            onClick={() => navigate("/activities")}
          >
            Activities
          </li>

          {isLoggedIn && (
            <>
              <li
                className="cursor-pointer hover:text-text-primary"
                onClick={() => navigate("/profile")}
              >
                Profile
              </li>

              <li
                className="cursor-pointer text-error hover:opacity-80"
                onClick={logout}
              >
                Logout
              </li>
            </>
          )}
        </ul>

        {/* THEME TOGGLE */}
        <div className="pt-4 border-t border-border">
          <ThemeToggle />
        </div>
      </div>

      {/* OVERLAY */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
    </div>
  );
}