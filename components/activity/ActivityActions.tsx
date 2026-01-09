type ViewerRole = "guest" | "host";
type JoinStatus = "none" | "pending" | "approved" | "rejected";

type Props = {
  viewerRole: ViewerRole;
  joinStatus: JoinStatus;
  hasUnread: boolean;
  onRequestJoin: () => void;
  onOpenChat: () => void;
  onOpenReview: () => void;
};

export default function ActivityActions({
  viewerRole,
  joinStatus,
  hasUnread,
  onRequestJoin,
  onOpenChat,
  onOpenReview,
}: Props) {
  return (
    <section className="mt-8 px-4 pb-6 space-y-3">
      {/* GUEST */}
      {viewerRole === "guest" && joinStatus === "none" && (
        <button
          onClick={onRequestJoin}
          className="w-full rounded-xl bg-black py-3 text-white"
        >
          Request to Join
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "pending" && (
        <button disabled className="w-full rounded-xl border py-3 text-gray-500">
          Request Sent
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "rejected" && (
        <button disabled className="w-full rounded-xl border py-3 text-red-500">
          Your request was declined
        </button>
      )}

      {viewerRole === "guest" && joinStatus === "approved" && (
        <>
          <p className="text-sm text-green-600 text-center">
            Your request was approved
          </p>
          <button
            onClick={onOpenChat}
            className="w-full rounded-xl bg-black py-3 text-white relative"
          >
            Open Chat
            {hasUnread && (
              <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </>
      )}

      {/* HOST */}
      {viewerRole === "host" && (
        <>
          <button
            onClick={onOpenReview}
            className="w-full rounded-xl bg-black py-3 text-white"
          >
            Review Requests
          </button>

          <button
            onClick={onOpenChat}
            className="w-full rounded-xl border py-3 relative"
          >
            Open Chat
            {hasUnread && (
              <span className="absolute top-2 right-3 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </>
      )}
    </section>
  );
}