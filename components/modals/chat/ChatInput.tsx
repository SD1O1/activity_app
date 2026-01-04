"use client";

type Props = {
  text: string;
  setText: (v: string) => void;
  send: () => void;
};

export default function ChatInput({ text, setText, send }: Props) {
  return (
    <div className="p-3 border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded-xl px-3 py-2 text-sm"
      />
      <button
        onClick={send}
        className="bg-black text-white rounded-xl px-4"
      >
        Send
      </button>
    </div>
  );
}