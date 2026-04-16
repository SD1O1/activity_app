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
      <div className="rounded-3xl border border-orange-100/80 bg-white p-6 text-center shadow-[0_16px_32px_-28px_rgba(15,23,42,0.55)]">
        <div className="text-5xl font-semibold text-slate-900">{hostedCount}</div>
        <div className="mt-1 text-sm font-semibold tracking-wider text-slate-500">HOSTED</div>
      </div>

      <div className="rounded-3xl border border-orange-100/80 bg-white p-6 text-center shadow-[0_16px_32px_-28px_rgba(15,23,42,0.55)]">
        <div className="text-5xl font-semibold text-slate-900">{joinedCount}</div>
        <div className="mt-1 text-sm font-semibold tracking-wider text-slate-500">JOINED</div>
      </div>
    </div>
  );
}
