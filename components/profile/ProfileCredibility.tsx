interface ProfileCredibilityProps {
  hostedCount: number;
  joinedCount: number;
}

export function ProfileCredibility({
  hostedCount,
  joinedCount,
}: ProfileCredibilityProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <div className="text-5xl font-semibold text-neutral-900">{hostedCount}</div>
        <div className="mt-1 text-sm font-semibold tracking-wider text-neutral-500">HOSTED</div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
        <div className="text-5xl font-semibold text-neutral-900">{joinedCount}</div>
        <div className="mt-1 text-sm font-semibold tracking-wider text-neutral-500">JOINED</div>
      </div>
    </div>
  );
}
