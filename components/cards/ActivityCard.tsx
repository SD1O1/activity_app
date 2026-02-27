import { PublicUser } from "@/types/publicUser";

type ActivityCardProps = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  startsAt: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
  host?: PublicUser | null;
  memberCount?: number | null;
  maxMembers?: number | null;
  onClick?: () => void;
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}

export default function ActivityCard({
  title,
  subtitle,
  location,
  startsAt,
  type,
  tags,
  host,
  memberCount,
  maxMembers,
  onClick,
}: ActivityCardProps) {
  const primaryTag = tags?.[0]?.name ?? (type === "group" ? "Social" : "1-on-1");
  const joinedText =
    typeof memberCount === "number" && typeof maxMembers === "number"
      ? `${memberCount}/${maxMembers} joined${memberCount >= maxMembers ? " (Full)" : ""}`
      : type === "group"
        ? "Open group"
        : "Private meetup";

  return (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-[28px] border border-[#e5e7eb] bg-white p-4 shadow-sm transition hover:shadow-md md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {host?.avatar_url ? (
            <img
              src={host.avatar_url}
              alt={host?.name || host?.username || "Host avatar"}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#cbd5e1] text-sm font-semibold text-[#334155]">
              {(host?.name || host?.username || "H").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-2xl font-semibold leading-none text-[#0f172a]">{host?.name || host?.username || "Host"}</p>
            <p className="mt-1 text-lg text-[#64748b]">{formatRelativeTime(startsAt)}</p>
          </div>
        </div>

        <span className="rounded-full bg-[#eff6ff] px-4 py-1 text-lg font-medium text-[#2563eb]">{primaryTag}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_190px] md:items-center">
        <div>
          <h3 className="text-4xl font-semibold leading-tight text-[#0f172a]">{title}</h3>
          <p className="mt-2 text-2xl text-[#334155]">{subtitle}</p>

          <p className="mt-3 text-xl text-[#64748b]">📍 {location}</p>
          <p className={`mt-1 text-xl ${joinedText.includes("Full") ? "text-[#f08f26]" : "text-[#64748b]"}`}>👥 {joinedText}</p>
        </div>

        <div className="h-36 rounded-3xl bg-gradient-to-br from-[#fde68a] via-[#fdba74] to-[#f97316] md:h-40" />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#e5e7eb] pt-4">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-9 w-9 rounded-full border-2 border-white bg-[#cbd5e1]"
            />
          ))}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e2e8f0] text-sm font-semibold text-[#64748b]">
            +
          </div>
        </div>

        <button
          type="button"
          className="rounded-2xl bg-[#f59e0b] px-6 py-2 text-2xl font-semibold text-white shadow-sm"
        >
          {joinedText.includes("Full") ? "Full" : "Join"}
        </button>
      </div>
    </article>
  );
}