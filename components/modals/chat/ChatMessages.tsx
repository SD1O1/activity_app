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
    <div className="flex-1 overflow-y-auto px-5 py-4">
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
          <div key={m.id} className="mb-3">
            <div className={`flex items-end ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && isFirstInGroup && (
                <button onClick={handleAvatarClick} className="mr-3 shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="avatar" width={38} height={38} className="h-10 w-10 rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-300 text-xs font-semibold text-neutral-600">
                      {(username ?? m.sender_id)[0].toUpperCase()}
                    </div>
                  )}
                </button>
              )}

              <div className={`max-w-[78%] rounded-[1.5rem] px-4 py-3 text-3xl leading-relaxed ${isMe ? "bg-amber-500 text-white" : "bg-neutral-200 text-slate-900"}`}>
                {m.content}
              </div>
            </div>

            {isLastMessageFromMe && <div className="mt-1 pr-2 text-right text-sm italic text-neutral-400">{getMessageStatusText(m)}</div>}
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
