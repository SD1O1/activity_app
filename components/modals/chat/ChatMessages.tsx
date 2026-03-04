"use client";

import { Message, Participant } from "./types";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  messages: Message[];
  myId: string | null;
  participants?: Participant[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  getMessageStatusText: (m: Message) => string | null;
};

export default function ChatMessages({ messages, myId, participants, bottomRef, getMessageStatusText }: Props) {
  const router = useRouter();

  const getParticipant = (userId: string) => participants?.find((p) => p.user_id === userId);

  return (
    <div className="chat-area flex-1 overflow-y-auto p-5">
      {messages.map((m, index) => {
        const isMe = m.sender_id === myId;

        const prev = messages[index - 1];
        const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;

        const isLastMessageFromMe = isMe && messages.slice(index + 1).every((nextMsg) => nextMsg.sender_id !== myId);

        const participant = getParticipant(m.sender_id);
        const avatarUrl = participant?.avatar_url;
        const username = participant?.username;

        const handleAvatarClick = () => {
          if (isMe) router.push("/profile");
          else if (username) router.push(`/u/${username}`);
        };

        return (
          <div key={m.id} className="mb-4">
            <div className={`flex items-end gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && isFirstInGroup && (
                <button onClick={handleAvatarClick} className="shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="avatar" width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                      {(username ?? m.sender_id)[0].toUpperCase()}
                    </div>
                  )}
                </button>
              )}

              <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${isMe ? "rounded-tr-none bg-[#ff6b00] text-white" : "rounded-tl-none bg-gray-100 text-gray-800"}`}>
                  {m.content}
                </div>

                {isLastMessageFromMe && <span className="mt-1 px-1 text-[11px] text-gray-400">{getMessageStatusText(m)}</span>}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
