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
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-orange-100/80 bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] sm:mx-auto sm:max-w-md sm:rounded-[1.75rem] sm:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.6)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-orange-200" />
        </div>

        <div className="flex items-center justify-between border-b border-orange-100/80 bg-white/85 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Activity Chat</h2>
            <p className="text-sm text-slate-500">{otherParticipant?.username ? `with @${otherParticipant.username}` : "Stay connected"}</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onChatClosed?.();
            }}
            className="grid h-9 w-9 place-items-center rounded-full border border-orange-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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