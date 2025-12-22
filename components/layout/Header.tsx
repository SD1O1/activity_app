"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function Header() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // mock auth for now
  const isLoggedIn = true;

  return (
    <>
      <header className="h-14 border-b flex items-center justify-between px-4 bg-white">
        {/* LEFT */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-xl"
        >
          ☰
        </button>

        {/* CENTER */}
        <div className="text-sm font-semibold">
          PerfectBench
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button onClick={() => router.push("/notifications")}>
              🔔
            </button>
          )}

          <button onClick={() => router.push("/profile")}>
            👤
          </button>
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
}