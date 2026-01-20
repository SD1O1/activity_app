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

export default function ChatMessages({
  messages,
  myId,
  participants,
  bottomRef,
  getMessageStatusText,
}: Props) {
  const router = useRouter();

  const getParticipant = (userId: string) =>
    participants?.find(p => p.user_id === userId);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((m, index) => {
        const isMe = m.sender_id === myId;

        const prev = messages[index - 1];
        const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;

        // ✅ Always show status on LAST message SENT BY ME
        const isLastMessageFromMe =
          isMe &&
          messages
            .slice(index + 1)
            .every(nextMsg => nextMsg.sender_id !== myId);

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
          <div key={m.id} className="mb-2">
            <div
              className={`flex items-end ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar */}
              {!isMe && isFirstInGroup && (
                <button
                  onClick={handleAvatarClick}
                  className="mr-2 shrink-0"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {(username ?? m.sender_id)[0].toUpperCase()}
                    </div>
                  )}
                </button>
              )}

              {/* Message bubble */}
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

            {/* Sent / Seen status */}
            {isLastMessageFromMe && (
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