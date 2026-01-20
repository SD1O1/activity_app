"use client";

type Props = {
  message: string;
  time: string;
  isRead: boolean;
  actorName?: string;
  actorAvatar?: string | null;
  onClick: () => void;
};

export default function NotificationItem({
  message,
  time,
  isRead,
  actorName,
  actorAvatar,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer ${
        isRead ? "bg-white" : "bg-gray-100"
      }`}
    >
      <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
        {actorAvatar && (
          <img
            src={actorAvatar}
            alt={actorName}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-900">
          <span className="font-medium">
            {actorName || "Someone"}
          </span>{" "}
          {message}
        </p>
        <p className="mt-1 text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}