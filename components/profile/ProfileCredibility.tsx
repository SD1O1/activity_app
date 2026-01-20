interface ProfileCredibilityProps {
    hostedCount: number;
    joinedCount: number;
  }
  
  export function ProfileCredibility({
    hostedCount,
    joinedCount,
  }: ProfileCredibilityProps) {
    return (
      <div className="grid grid-cols-2 gap-4 border rounded-lg p-4">
        <div className="text-center">
          <div className="text-xl font-semibold">{hostedCount}</div>
          <div className="text-sm text-gray-500">Hosted</div>
        </div>
  
        <div className="text-center">
          <div className="text-xl font-semibold">{joinedCount}</div>
          <div className="text-sm text-gray-500">Joined</div>
        </div>
      </div>
    );
  }  