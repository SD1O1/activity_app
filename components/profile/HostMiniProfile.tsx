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
          size === "sm" ? "h-12 w-12" : "h-14 w-14"
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

      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold leading-tight text-neutral-900">{host.name ?? "Unknown"}</span>
          {host.verified && <span className="text-lg text-blue-600">✓</span>}
        </div>

        <p className="text-base text-neutral-500">Host{host.username ? ` · @${host.username}` : ""}</p>
      </div>
    </>
  );

  if (canNavigate) {
    return (
      <Link
        href={`/u/${host.username}`}
        className="flex items-center gap-4 rounded-2xl bg-neutral-100 p-4"
        aria-label={`Open ${host.name ?? "host"} profile`}
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-4 rounded-2xl bg-neutral-100 p-4">{content}</div>;
}
