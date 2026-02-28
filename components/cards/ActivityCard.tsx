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

export default function ActivityCard({ title, subtitle, location, startsAt, type, tags, host, memberCount, maxMembers, onClick }: ActivityCardProps) {
  const primaryTag = tags?.[0]?.name ?? (type === "group" ? "Social" : "1-on-1");
  const joinedText = typeof memberCount === "number" && typeof maxMembers === "number" ? `${memberCount}/${maxMembers} joined${memberCount >= maxMembers ? " (Full)" : ""}` : type === "group" ? "Open group" : "Private meetup";

  return (
    <article onClick={onClick} className="cursor-pointer rounded-2xl border border-black/5 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {host?.avatar_url ? (
            <img src={host.avatar_url} alt={host?.name || host?.username || "Host avatar"} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cbd5e1] text-[12px] font-semibold text-[#334155]">{(host?.name || host?.username || "H").slice(0, 1).toUpperCase()}</div>
          )}
          <div>
            <p className="text-[14px] font-semibold text-[#0f172a]">{host?.name || host?.username || "Host"}</p>
            <p className="mt-1 text-[13px] text-[#64748b]">{formatRelativeTime(startsAt)}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[12px] font-medium text-[#2563eb]">{primaryTag}</span>
      </div>

      <div className="mt-4">
        <h3 className="text-[20px] font-bold leading-tight text-[#0f172a]">{title}</h3>
        <p className="mt-1 text-[14px] text-[#334155]">{subtitle}</p>
        <p className="mt-2 text-[13px] text-[#64748b]">📍 {location}</p>
        <p className={`mt-1 text-[13px] ${joinedText.includes("Full") ? "text-[#f08f26]" : "text-[#64748b]"}`}>👥 {joinedText}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((item) => <div key={item} className="h-8 w-8 rounded-full border-2 border-white bg-[#cbd5e1]" />)}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#e2e8f0] text-[12px] font-semibold text-[#64748b]">+</div>
        </div>

        <button type="button" className="h-11 rounded-xl bg-[#f59e5b] px-5 text-[14px] font-semibold text-white">
          {joinedText.includes("Full") ? "Full" : "Join"}
        </button>
      </div>
    </article>
  );
}
