import HostMiniProfile from "@/components/profile/HostMiniProfile";
import { PublicUser } from "@/types/publicUser";

type ActivityCardProps = {
  title: string;
  subtitle: string;
  distance: string;
  time: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
  host?: PublicUser | null;
  hideHost?: boolean; // 👈 NEW
  onClick?: () => void;
};

export default function ActivityCard({
  title,
  subtitle,
  distance,
  time,
  type,
  host,
  hideHost = false, // 👈 DEFAULT
  onClick,
  tags,
}: ActivityCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full cursor-pointer space-y-3 rounded-3xl border border-orange-100/80 bg-gradient-to-b from-white to-orange-50/35 p-4 text-left shadow-[0_16px_30px_-26px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_20px_36px_-28px_rgba(249,115,22,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
    >
      {/* HOST (optional) */}
      {!hideHost && host && (
        <HostMiniProfile
          host={host}
          clickable
          size="sm"
        />
      )}

      {/* TITLE + TYPE */}
      <div className="flex items-start justify-between gap-3">
        <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <span className="whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#f97316]">
          {type === "group" ? "Group" : "1-on-1"}
        </span>
      </div>

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-orange-100 bg-white px-2.5 py-0.5 text-xs text-slate-600"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* META */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span className="font-medium text-[#f97316]">{time}</span>
        <span>{distance}</span>
      </div>
    </button>
  );
}