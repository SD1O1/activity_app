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
      <header className="sticky top-0 z-20 -mx-4 flex h-16 items-center justify-between border-b border-orange-100/80 bg-white/95 px-5 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">{isSelf ? "My Profile" : "Public Profile"}</h1>
        <ProfileActionsMenu isSelf={isSelf} profileId={profileId} username={username} />
      </header>

      <div className="mt-7 flex flex-col items-center text-center">
        <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 shadow-[0_18px_34px_-24px_rgba(249,115,22,0.55)] sm:h-44 sm:w-44">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-500">{displayName.charAt(0).toUpperCase()}</div>
          )}

          {(verified || phoneVerified) && (
            <span className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#f97316] text-lg text-white">
              ✪
            </span>
          )}
        </div>

        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {displayName}
          {age ? `, ${age}` : ""}
        </h2>

        {city?.trim() && <p className="mt-2 text-lg font-medium text-slate-500 sm:text-2xl">📍 {city.trim()}</p>}
      </div>
    </>
  );
}
