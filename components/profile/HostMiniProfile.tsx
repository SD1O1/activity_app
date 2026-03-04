"use client";

import Link from "next/link";
import { PublicUser } from "@/types/publicUser";

type Props = {
  host: PublicUser;
  clickable?: boolean;
  size?: "sm" | "md";
};

export default function HostMiniProfile({ host, clickable = false, size = "md" }: Props) {
  const canNavigate = clickable && !!host.username;

  const content = (
    <>
      <div className={`relative overflow-hidden rounded-full bg-gray-200 ${size === "sm" ? "h-12 w-12" : "h-14 w-14"}`}>
        {host.avatar_url && <img src={host.avatar_url} alt={host.name ?? "User"} className="h-full w-full object-cover" />}
        {host.verified && (
          <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-blue-500 text-xs text-white ring-2 ring-neutral-100">
            ✓
          </span>
        )}
      </div>

      <div className="text-left">
        <div className="text-2xl font-semibold leading-tight text-neutral-900">{host.name ?? "Unknown"}</div>
        <p className="text-lg text-neutral-500">Host{host.username ? ` · @${host.username}` : ""}</p>
      </div>
    </>
  );

  const cardClass = "flex items-center gap-4 rounded-2xl bg-neutral-100 p-4";

  if (canNavigate) {
    return (
      <Link href={`/u/${host.username}`} className={cardClass} aria-label={`Open ${host.name ?? "host"} profile`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
