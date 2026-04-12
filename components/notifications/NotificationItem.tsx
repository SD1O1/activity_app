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
  const displayName = actorName || "Someone";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
        isRead
          ? "border-orange-100/80 bg-white shadow-[0_14px_30px_-28px_rgba(15,23,42,0.8)] hover:border-orange-200 hover:bg-orange-50/30"
          : "border-orange-200 bg-gradient-to-r from-white to-orange-50/70 shadow-[0_16px_34px_-28px_rgba(249,115,22,0.8)] hover:border-orange-300 hover:from-white hover:to-orange-100/70"
      }`}
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 text-sm font-semibold text-slate-700">
        {actorAvatar ? <img src={actorAvatar} alt={displayName} className="h-full w-full object-cover" /> : <span>{initial}</span>}
      </div>

      <div className="flex-1">
        <p className="text-sm text-slate-700 sm:text-[0.95rem]">
          <span className="font-semibold text-slate-900">{displayName}</span> {message}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">{time}</p>
      </div>
    </button>
  );
}