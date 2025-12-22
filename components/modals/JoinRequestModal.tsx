type JoinRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
};
  
  export default function JoinRequestModal({
    open,
    onClose,
    onSubmit,
  }: JoinRequestModalProps) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/40">
        <div className="w-full rounded-t-2xl bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Request to Join
            </h2>
            <button
              onClick={onClose}
              className="text-sm text-gray-500"
            >
              Close
            </button>
          </div>
  
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">
                Why do you want to join?
              </p>
              <textarea
                className="mt-2 w-full rounded-lg border p-2 text-sm"
                rows={3}
                placeholder="Your answer"
              />
            </div>
  
            <div>
              <p className="text-sm font-medium">
                What kind of conversation do you enjoy?
              </p>
              <textarea
                className="mt-2 w-full rounded-lg border p-2 text-sm"
                rows={3}
                placeholder="Your answer"
              />
            </div>
          </div>
  
          <button
            onClick={onSubmit}
            className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-medium text-white"
          >
            Send Request
          </button>
        </div>
      </div>
    );
  }  