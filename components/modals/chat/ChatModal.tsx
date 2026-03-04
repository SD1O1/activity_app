"use client";

import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./useChat";

type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  onChatClosed?: () => void;
};

export default function ChatModal({ open, onClose, activityId, onChatClosed }: Props) {
  const { messages, text, setText, send, isOtherTyping, bottomRef, getMessageStatusText, myId, participants, sendError } = useChat(open, activityId);

  if (!open) return null;

  const otherParticipant = participants.find((p) => p.user_id !== myId);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white sm:mx-auto sm:max-w-md">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Activity Chat</h2>
            <p className="text-sm text-gray-500">{otherParticipant?.username ? `with @${otherParticipant.username}` : "Stay connected"}</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onChatClosed?.();
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <ChatMessages
          messages={messages}
          myId={myId}
          participants={participants}
          bottomRef={bottomRef}
          getMessageStatusText={getMessageStatusText}
        />

        <TypingIndicator show={isOtherTyping} />

        {sendError ? <p className="px-5 pb-1 text-sm text-red-600">{sendError}</p> : null}

        <ChatInput text={text} setText={setText} send={send} />
      </div>
    </div>
  );
}
