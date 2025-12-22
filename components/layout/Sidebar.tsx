"use client";

import { useRouter } from "next/navigation";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* SIDEBAR (LEFT) */}
      <div className="w-64 bg-white p-4">
        <h3 className="font-semibold mb-4">Menu</h3>

        <ul className="space-y-3">
          <li onClick={() => router.push("/")}>Home</li>
          <li onClick={() => router.push("/activities")}>Activities</li>
          <li onClick={() => router.push("/profile")}>Profile</li>
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