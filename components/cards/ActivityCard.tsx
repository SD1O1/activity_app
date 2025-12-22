type ActivityCardProps = {
    title: string;
    subtitle: string;
    distance: string;
    time: string;
    type: "group" | "one-on-one";
    onClick?: () => void;
  };
  
  export default function ActivityCard({
    title,
    subtitle,
    distance,
    time,
    type,
    onClick,
  }: ActivityCardProps) {
    return (
      <div onClick={onClick}
       className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
  
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