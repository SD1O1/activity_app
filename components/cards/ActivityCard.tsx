import HostMiniProfile from "@/components/profile/HostMiniProfile";
import { Host } from "@/types/host";

type ActivityCardProps = {
  title: string;
  subtitle: string;
  distance: string;
  time: string;
  type: "group" | "one-on-one";
  tags?: { id: string; name: string }[];
  host?: Host;
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
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm space-y-3"
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
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <span className="text-xs rounded-full border px-2 py-1 text-gray-600 whitespace-nowrap">
          {type === "group" ? "Group" : "1-on-1"}
        </span>
      </div>

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* META */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{time}</span>
        <span>{distance}</span>
      </div>
    </div>
  );
}