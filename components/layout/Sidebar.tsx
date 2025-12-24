"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-white p-4">
        <h3 className="font-semibold mb-4">Menu</h3>

        <ul className="space-y-3">
          <li onClick={() => router.push("/")}>Home</li>
          <li onClick={() => router.push("/activities")}>Activities</li>

          {isLoggedIn && (
            <>
              <li onClick={() => router.push("/profile")}>Profile</li>
              <li onClick={logout}>Logout</li>
            </>
          )}
        </ul>
      </div>

      {/* OVERLAY */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
    </div>
  );
}