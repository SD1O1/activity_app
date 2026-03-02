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
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{isSelf ? "My Profile" : "Public Profile"}</h1>
        <ProfileActionsMenu isSelf={isSelf} profileId={profileId} username={username} />
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow sm:h-40 sm:w-40">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-gray-500">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {(verified || phoneVerified) && (
            <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-blue-500 text-white">
              ✓
            </span>
          )}
        </div>

        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          {displayName}
          {age ? `, ${age}` : ""}
        </h2>

        {city?.trim() && (
          <p className="mt-2 text-xl text-neutral-500">📍 {city.trim()}</p>
        )}
      </div>
    </>
  );
}
