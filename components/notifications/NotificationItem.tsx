"use client";

type Notification = {
  id: string;
  avatar?: string;
  message: string;
  time: string;
  onClick?: () => void;
};

export default function NotificationItem({
  avatar,
  message,
  time,
  onClick,
}: Notification) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer"
    >
      <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}