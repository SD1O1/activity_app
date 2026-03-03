type Participant = {
  id: string;
  username?: string | null;
  name: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  role: "host" | "member";
};

type Props = {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
  isJoined: boolean;
  onRemove?: (userId: string) => void;
  onOpenProfile?: (participant: Participant) => void;
};

export default function ParticipantsRow({
  participants,
  currentUserId,
  isHost,
  isJoined,
  onRemove,
  onOpenProfile,
}: Props) {
  const canOpenProfile = isHost || isJoined;

  const orderedParticipants = [...participants].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });

  return (
    <section className="mt-10 px-4 pb-36">
      <p className="mb-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Participants <span className="text-neutral-400">({participants.length})</span>
      </p>

      <div className="flex gap-5 overflow-x-auto pb-3">
        {orderedParticipants.map((participant) => {
          const isYou = participant.id === currentUserId;
          const isHostUser = participant.role === "host";

          const displayName = isYou
            ? "You"
            : isHostUser
            ? "Host"
            : participant.name ?? "User";

          const canOpenParticipantProfile = canOpenProfile && !!participant.username;

          return (
            <div key={participant.id} className="flex min-w-[74px] flex-col items-center">
              <button
                type="button"
                disabled={!canOpenParticipantProfile}
                onClick={() => canOpenParticipantProfile && onOpenProfile?.(participant)}
                className={!canOpenParticipantProfile ? "cursor-default opacity-90" : ""}
              >
                <img
                  src={participant.avatar_url ?? "/avatar-placeholder.png"}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-neutral-200"
                />
              </button>

              <div className="mt-2 flex items-center text-sm">
                <span className="font-medium text-neutral-800">{displayName}</span>
                {participant.verified && <span className="ml-1 text-blue-500">✔</span>}
              </div>

              {isHost && !isYou && participant.role === "member" && onRemove && (
                <button
                  onClick={() => onRemove(participant.id)}
                  className="mt-1 text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
