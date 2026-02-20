"use client";

import Link from "next/link";
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
  const canNavigate = clickable && !!host.username;

  const content = (
    <>
      <div
        className={`rounded-full bg-gray-200 overflow-hidden ${
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        {host.avatar_url && (
          <img
            src={host.avatar_url}
            alt={host.name ?? "User"}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="text-sm text-left">
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-900">{host.name ?? "Unknown"}</span>
          {host.verified && <span className="text-xs text-blue-600">✓</span>}
        </div>

        {host.username && <p className="text-xs text-gray-500">@{host.username}</p>}
      </div>
    </>
  );

  if (canNavigate) {
    return (
      <Link
        href={`/u/${host.username}`}
        className="flex items-center gap-3 cursor-pointer"
        aria-label={`Open ${host.name ?? "host"} profile`}
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3">{content}</div>;
}