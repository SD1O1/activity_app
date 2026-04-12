"use client";

type Props = {
  show: boolean;
};

export default function TypingIndicator({ show }: Props) {
  if (!show) return null;

  return <div className="px-5 pb-1 text-xs italic text-slate-500">Someone is typing…</div>;
}
