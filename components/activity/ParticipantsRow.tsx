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
    <section className="px-4 mt-8 md:px-6">
      <h2 className="text-2xl font-semibold md:text-3xl">
        Participants <span className="text-xl text-gray-400 md:text-2xl">({participants.length})</span>
      </h2>

      <div className="mt-5 flex gap-5 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
        {orderedParticipants.map((participant) => {
          const isYou = participant.id === currentUserId;
          const displayName = isYou ? "You" : participant.name ?? "User";
          const canOpenParticipantProfile = canOpenProfile && !!participant.username;

          return (
            <div key={participant.id} className="flex min-w-[68px] flex-col items-center md:min-w-[84px]">
              <button
                type="button"
                disabled={!canOpenParticipantProfile}
                onClick={() => canOpenParticipantProfile && onOpenProfile?.(participant)}
                className={!canOpenParticipantProfile ? "cursor-default" : ""}
              >
                <img
                  src={participant.avatar_url ?? "/avatar-placeholder.png"}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover md:h-16 md:w-16"
                />
              </button>

              <p className="mt-2 text-sm text-gray-900">{displayName}</p>

              {isHost && !isYou && participant.role === "member" && onRemove && (
                <button onClick={() => onRemove(participant.id)} className="mt-1 text-[11px] text-red-500 hover:underline">
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