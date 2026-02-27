"use client";

import { Message, Participant } from "./types";
import { useRouter } from "next/navigation";

type Props = {
  messages: Message[];
  myId: string | null;
  participants?: Participant[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  getMessageStatusText: (m: Message) => string | null;
};

const formatTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

export default function ChatMessages({
  messages,
  myId,
  participants,
  bottomRef,
  getMessageStatusText,
}: Props) {
  const router = useRouter();

  const getParticipant = (userId: string) => participants?.find((p) => p.user_id === userId);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      {messages.map((m, index) => {
        const isMe = m.sender_id === myId;

        const prev = messages[index - 1];
        const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;

        const isLastMessageFromMe =
          isMe && messages.slice(index + 1).every((nextMsg) => nextMsg.sender_id !== myId);

        const participant = getParticipant(m.sender_id);
        const avatarUrl = participant?.avatar_url;
        const username = participant?.username;

        const handleAvatarClick = () => {
          if (isMe) {
            router.push("/profile");
          } else if (username) {
            router.push(`/u/${username}`);
          }
        };

        return (
          <div key={m.id} className="mb-3">
            <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && isFirstInGroup && (
                <button onClick={handleAvatarClick} className="mb-3 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-semibold text-gray-600">
                      {(username ?? m.sender_id)[0].toUpperCase()}
                    </div>
                  )}
                </button>
              )}

              <div
                className={`max-w-[82%] rounded-[20px] px-4 py-3 text-[19px] leading-[1.35] sm:text-[21px] ${
                  isMe ? "bg-[#16161a] text-white" : "bg-[#e8e8ea] text-[#1f1f23]"
                }`}
              >
                {m.content}
              </div>
            </div>

            <div className={`mt-1 text-[18px] text-[#7b7b81] ${isMe ? "pr-2 text-right" : "pl-12"}`}>{formatTime(m.created_at)}</div>

            {isLastMessageFromMe && getMessageStatusText(m) ? (
              <div className="mt-0.5 pr-2 text-right text-xs italic text-[#8b8b90]">{getMessageStatusText(m)}</div>
            ) : null}
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}