"use client";

type Props = {
  text: string;
  setText: (v: string) => void;
  send: () => void;
};

export default function ChatInput({ text, setText, send }: Props) {
  return (
    <div className="border-t border-neutral-200 bg-neutral-100 p-4">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-neutral-200 px-5 py-3 text-2xl text-neutral-700 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} className="grid h-14 w-14 place-items-center rounded-full bg-amber-500 text-3xl text-white">
          ➤
        </button>
      </div>
    </div>
  );
}
