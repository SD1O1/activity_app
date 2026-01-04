"use client";

import { Message } from "./types";

type Props = {
  messages: Message[];
  myId: string | null;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  getMessageStatusText: (m: Message) => string | null;
};


export default function ChatMessages({
  messages,
  myId,
  bottomRef,
  getMessageStatusText,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((m, index) => {
        const isMe = m.sender_id === myId;
        const next = messages[index + 1];
        const showMeta = !next || next.sender_id !== m.sender_id;

        return (
          <div key={m.id} className="mb-2">
            <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl ${
                  isMe
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.content}
              </div>
            </div>

            {isMe && showMeta && (
              <div className="text-[11px] italic text-gray-400 text-right pr-2 mt-1">
                {getMessageStatusText(m)}
              </div>
            )}
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}