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

export default function ChatModal({
  open,
  onClose,
  activityId,
  onChatClosed,
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
  } = useChat(open, activityId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col h-[80vh]">
        {/* Header (inline, no separate file) */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Activity Chat</h2>
          <button
            onClick={() => {
              onClose();
              onChatClosed?.();
            }}
            className="text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        <ChatMessages
          messages={messages}
          myId={myId}
          bottomRef={bottomRef}
          getMessageStatusText={getMessageStatusText}
        />

        <TypingIndicator show={isOtherTyping} />

        <ChatInput
          text={text}
          setText={setText}
          send={send}
        />
      </div>
    </div>
  );
}
