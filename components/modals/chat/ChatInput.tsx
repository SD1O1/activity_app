"use client";

type Props = {
  text: string;
  setText: (v: string) => void;
  send: () => void;
};

export default function ChatInput({ text, setText, send }: Props) {
  return (
    <div className="border-t border-orange-100/80 bg-white/90 px-5 py-4 pb-8 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-orange-200 bg-orange-50/45 px-5 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus-visible:ring-2 focus-visible:ring-orange-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          onClick={send}
          className="grid h-12 w-12 place-items-center rounded-full border border-[#f97316] bg-[#f97316] text-white shadow-[0_16px_24px_-18px_rgba(249,115,22,0.9)] transition-all duration-200 hover:bg-[#ea6a11] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          ➤
        </button>
      </div>
    </div>
  );
}