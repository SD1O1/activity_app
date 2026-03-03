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
  const {
    messages,
    text,
    setText,
    send,
    isOtherTyping,
    bottomRef,
    getMessageStatusText,
    myId,
    participants,
    sendError,
  } = useChat(open, activityId);

  if (!open) return null;

  const otherParticipant = participants.find((p) => p.user_id !== myId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 p-0 sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col rounded-none bg-neutral-100 sm:h-[92vh] sm:rounded-[2rem] sm:shadow-2xl">
        <div className="mx-auto mt-2 h-2 w-20 rounded-full bg-neutral-300 sm:hidden" />

        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-5xl font-semibold tracking-tight text-slate-900">Activity Chat</h2>
            <p className="text-2xl text-neutral-500">{otherParticipant?.username ? `with @${otherParticipant.username}` : "Stay connected"}</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onChatClosed?.();
            }}
            className="grid h-12 w-12 place-items-center rounded-full bg-neutral-200 text-4xl text-neutral-600"
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
