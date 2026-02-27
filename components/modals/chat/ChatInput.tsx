"use client";

type Props = {
  text: string;
  setText: (v: string) => void;
  send: () => void;
};

export default function ChatInput({ text, setText, send }: Props) {
  return (
    <div className="border-t border-[#d8d8d8] px-4 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="h-14 flex-1 rounded-full bg-[#e8e8ea] px-5 text-[20px] text-[#1f1f23] placeholder:text-[#a4a4b5] outline-none"
        />
        <button
          onClick={send}
          aria-label="Send"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#17171b] text-[26px] text-white"
        >
          ↗
        </button>
      </div>
    </div>
  );
}