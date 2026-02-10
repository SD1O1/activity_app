type Participant = {
    id: string;
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
    onOpenProfile?: (userId: string) => void;
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
  
    // Put "You" first
    const orderedParticipants = [...participants].sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return 0;
    });
  
    return (
      <div className="px-4 mt-4">
        <p className="mb-2 text-sm text-gray-600">
          Participants ({participants.length})
        </p>
  
        <div className="flex gap-4 overflow-x-auto pb-2">
          {orderedParticipants.map((p) => {
            const isYou = p.id === currentUserId;
            const isHostUser = p.role === "host";
  
            const displayName = isYou
              ? "You"
              : isHostUser
              ? "Host"
              : p.name ?? "User";
  
            return (
              <div
                key={p.id}
                className="flex min-w-[64px] flex-col items-center"
              >
                <button
                  type="button"
                  disabled={!canOpenProfile}
                  onClick={() =>
                    canOpenProfile && onOpenProfile?.(p.id)
                  }
                  className={!canOpenProfile ? "cursor-default" : ""}
                >
                  <img
                    src={p.avatar_url ?? "/avatar-placeholder.png"}
                    alt={displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                </button>
  
                <div className="mt-1 flex items-center text-xs">
                  <span className="font-medium">{displayName}</span>
  
                  {p.verified && (
                    <span className="ml-1 text-blue-500">✔</span>
                  )}
                </div>
  
                {/* Host can remove only members (not self, not host) */}
                {isHost &&
                  !isYou &&
                  p.role === "member" &&
                  onRemove && (
                    <button
                      onClick={() => onRemove(p.id)}
                      className="mt-1 text-[10px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }  