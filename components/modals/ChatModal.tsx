"use client";

type ChatModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ChatModal({
  open,
  onClose,
}: ChatModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="flex h-[80vh] w-full flex-col rounded-t-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">
            Activity Chat
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          <div className="max-w-[80%] rounded-xl bg-gray-100 p-3">
            Hey! Looking forward to meeting 🙂
          </div>

          <div className="ml-auto max-w-[80%] rounded-xl bg-black p-3 text-white">
            Same here! See you soon.
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <input
              placeholder="Type a message..."
              className="flex-1 rounded-full border px-4 py-2 text-sm outline-none"
            />
            <button className="rounded-full bg-black px-4 py-2 text-sm text-white">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}