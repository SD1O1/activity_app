"use client";

type NotificationItemProps = {
  message: string;
  time: string;
  is_read: boolean;
  actor_name?: string;
  actor_avatar?: string | null;
  onClick: () => void;
};

export default function NotificationItem({
  message,
  time,
  is_read,
  actor_name,
  actor_avatar,
  onClick,
}: NotificationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer ${
        is_read ? "bg-white" : "bg-gray-100"
      }`}
    >
      <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
        {actor_avatar && (
          <img
            src={actor_avatar}
            alt={actor_name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{actor_name || "Someone"}</span>{" "}
          {message}
        </p>
        <p className="mt-1 text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}