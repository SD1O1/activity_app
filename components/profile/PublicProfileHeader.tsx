import Image from "next/image";
import { ProfileActionsMenu } from "./ProfileActionsMenu";

interface PublicProfileHeaderProps {
  name: string | null;
  age: number | null;
  city: string | null;
  avatarUrl: string | null;
  verified: boolean | null;
  phoneVerified: boolean | null;
  isSelf: boolean;
  profileId: string;
  username: string;
}

export function PublicProfileHeader({
  name,
  age,
  city,
  avatarUrl,
  verified,
  phoneVerified,
  isSelf,
  profileId,
  username,
}: PublicProfileHeaderProps) {
  const displayName = name ?? "User";

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-200">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name & meta */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {displayName}
              {age ? `, ${age}` : ""}
            </h1>

            {verified && (
              <span title="Verified profile">✔️</span>
            )}

            {phoneVerified && (
              <span title="Phone verified">📱</span>
            )}
          </div>

          {city?.trim() && (
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <span>📍</span>
              <span>
                {city.trim().charAt(0).toUpperCase() + city.trim().slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <ProfileActionsMenu
        isSelf={isSelf}
        profileId={profileId}
        username={username}
      />
    </div>
  );
}