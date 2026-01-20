"use client";

import { useRouter } from "next/navigation";
import { PublicUser } from "@/types/publicUser";

type Props = {
  host: PublicUser;
  clickable?: boolean;
  size?: "sm" | "md";
};

export default function HostMiniProfile({
  host,
  clickable = false,
  size = "md",
}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (!clickable) return;
    if (!host.username) return; // ✅ guard
    router.push(`/profile/u/${host.username}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      {/* AVATAR */}
      <div
        className={`rounded-full bg-gray-200 overflow-hidden ${
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        {host.avatar_url && (
          <img
            src={host.avatar_url}
            alt={host.name ?? "User"}   /* ✅ FIX */
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* INFO */}
      <div className="text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-900">
            {host.name ?? "Unknown"}
          </span>
          {host.verified && (
            <span className="text-xs text-blue-600">✓</span>
          )}
        </div>

        {host.username && (
          <p className="text-xs text-gray-500">
            @{host.username}
          </p>
        )}
      </div>
    </div>
  );
}