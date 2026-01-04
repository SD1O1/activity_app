"use client";

type Props = {
  show: boolean;
};

export default function TypingIndicator({ show }: Props) {
  if (!show) return null;

  return (
    <div className="px-4 pb-1 text-xs text-gray-500 italic">
      Someone is typing…
    </div>
  );
}
