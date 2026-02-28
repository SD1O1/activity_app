"use client";

import { useEffect } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./useChat";

type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  onChatClosed?: () => void;
  activityTitle?: string;
  hostName?: string | null;
};

export default function ChatModal({
  open,
  onClose,
  activityId,
  onChatClosed,
  activityTitle,
  hostName,
}: Props) {
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

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end overflow-y-auto overscroll-contain bg-black/45 sm:items-center sm:justify-center sm:p-4">
      <div className="h-[90vh] w-full overflow-hidden rounded-t-[26px] bg-[#f3f3f3] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[26px]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-[#d8d8d8] px-6 py-7">
            <div>
              <h2 className="text-[42px] font-medium leading-none text-[#1f1f23] md:text-[34px]">
                {activityTitle || "Activity Chat"}
              </h2>
              {hostName ? <p className="mt-1 text-[20px] text-[#77777c]">with {hostName}</p> : null}
            </div>
            <button
              onClick={() => {
                onClose();
                onChatClosed?.();
              }}
              className="text-4xl leading-none text-[#5a5a5a]"
              aria-label="Close"
            >
              ×
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

          {sendError ? <p className="px-6 pb-1 text-sm text-red-600">{sendError}</p> : null}

          <ChatInput text={text} setText={setText} send={send} />
        </div>
      </div>
    </div>
  );
}