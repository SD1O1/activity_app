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
      <div className={`relative overflow-hidden rounded-full bg-orange-50 ${size === "sm" ? "h-12 w-12" : "h-14 w-14"}`}>
        {host.avatar_url && <img src={host.avatar_url} alt={host.name ?? "User"} className="h-full w-full object-cover" />}
        {host.verified && (
          <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-[#f97316] text-xs text-white ring-2 ring-orange-100">
            ✓
          </span>
        )}
      </div>

      <div className="text-left">
        <div className="text-base font-semibold leading-tight text-slate-900 sm:text-xl">{host.name ?? "Unknown"}</div>
        <p className="text-sm text-slate-500 sm:text-base">Host{host.username ? ` · @${host.username}` : ""}</p>
      </div>
    </>
  );

  const cardClass = "flex items-center gap-4 rounded-2xl border border-orange-100/80 bg-orange-50/60 p-4";

  if (canNavigate) {
    return (
      <Link href={`/u/${host.username}`} className={cardClass} aria-label={`Open ${host.name ?? "host"} profile`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
