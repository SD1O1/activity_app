type ActivityCardProps = {
  title: string;
  subtitle: string;
  distance: string;
  time: string;
  type: "group" | "one-on-one";
  onClick?: () => void;
  tags?: { id: string; name: string }[];
};

export default function ActivityCard({
  title,
  subtitle,
  distance,
  time,
  type,
  onClick,
  tags,
}: ActivityCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        {/* LEFT */}
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>

          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
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
        </div>

        {/* RIGHT */}
        <span className="text-xs rounded-full border px-2 py-1 text-gray-600">
          {type === "group" ? "Group activity" : "1-on-1"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>{time}</span>
        <span>{distance}</span>
      </div>
    </div>
  );
}