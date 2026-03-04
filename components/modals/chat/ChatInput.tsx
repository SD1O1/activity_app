"use client";

type Props = {
  text: string;
  setText: (v: string) => void;
  send: () => void;
};

export default function ChatInput({ text, setText, send }: Props) {
  return (
    <div className="border-t border-gray-100 bg-white px-5 py-4 pb-8">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-[15px] text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#ff6b00]/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6b00] text-white shadow-lg shadow-orange-500/30 transition hover:scale-105 active:scale-95">
          ➤
        </button>
      </div>
    </div>
  );
}
