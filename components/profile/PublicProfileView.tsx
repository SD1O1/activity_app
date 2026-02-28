import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { ProfileActionsMenu } from "./ProfileActionsMenu";

const PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE = 50;

function getAge(dob: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface PublicProfileViewProps {
  username: string;
}

export async function PublicProfileView({ username }: PublicProfileViewProps) {
  const supabase = await createSupabaseServer();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      name,
      bio,
      avatar_url,
      city,
      dob,
      interests,
      verified,
      phone_verified
    `)
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  if (viewer) {
    const { data: block } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${viewer.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${viewer.id})`
      )
      .maybeSingle();

    if (block) notFound();
  }

  const isSelf = viewer?.id === profile.id;
  const age = getAge(profile.dob);

  const [{ count: hostedCount }, { count: joinedCount }] = await Promise.all([
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("host_id", profile.id).not("status", "eq", "deleted"),
    supabase.from("activity_members").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "active"),
  ]);

  const { data: hostedActivities } = await supabase
    .from("activities")
    .select(`id,title,starts_at,location_name,status`)
    .eq("host_id", profile.id)
    .not("status", "eq", "deleted")
    .order("starts_at", { ascending: true })
    .limit(PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE);

  return (
    <main className="mobile-app-container pb-8 text-[#121826]">
      <div className="mx-auto w-full max-w-[420px]">
        <section className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h1 className="text-[20px] font-semibold leading-none">Profile</h1>
          <ProfileActionsMenu isSelf={isSelf} profileId={profile.id} username={profile.username} />
        </section>

        <section className="px-5 pt-6 text-center">
          <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.name ?? "User"} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[14px] text-gray-500">{(profile.name ?? "U").charAt(0)}</div>
            )}
            {profile.verified && <div className="absolute bottom-2 right-2 rounded-full bg-[#2d9bf0] px-2 py-1 text-white">✓</div>}
          </div>

          <h2 className="mt-5 text-[24px] font-semibold leading-tight">{profile.name ?? "User"}{age ? `, ${age}` : ""}</h2>
          {profile.city && <p className="mt-1 text-[14px] text-[#6b7280]">📍 {profile.city}</p>}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(profile.interests ?? []).map((interest: string) => (
              <span key={interest} className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#ece8ff", color: "#6d28d9" }}>
                {interest}
              </span>
            ))}
          </div>

          <p className="mx-auto mt-4 max-w-[90%] text-[14px] leading-snug text-[#6b7280]">{profile.bio || "No bio added yet."}</p>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 px-5">
          <div className="app-card px-4 py-5 text-center shadow-sm">
            <p className="text-[24px] font-bold">{hostedCount ?? 0}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-wide text-[#6b7280]">HOSTED</p>
          </div>
          <div className="app-card px-4 py-5 text-center shadow-sm">
            <p className="text-[24px] font-bold">{joinedCount ?? 0}</p>
            <p className="mt-1 text-[14px] font-semibold tracking-wide text-[#6b7280]">JOINED</p>
          </div>
        </section>

        <section className="mt-6 border-b border-[#d9dce2] px-5 pb-3">
          <h3 className="text-[14px] font-semibold">Hosting</h3>
        </section>

        <section className="space-y-4 px-5 pt-5">
          {!hostedActivities || hostedActivities.length === 0 ? (
            <div className="app-card p-5 text-xl text-[#6b7280]">No activities hosted yet.</div>
          ) : (
            hostedActivities.map((activity) => {
              const isPast = activity.status === "completed";
              return (
                <Link key={activity.id} href={`/activity/${activity.id}`} className="block app-card p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e3cf] text-[14px]">☕</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[20px] font-semibold">{activity.title}</h3>
                      <p className="mt-1 text-[14px] text-[#6b7280]">🕒 {formatWhen(activity.starts_at)}</p>
                      <p className="mt-2 truncate text-[14px] text-[#6b7280]">📍 {activity.location_name || "Location TBD"}</p>
                    </div>
                    {isPast && <span className="rounded-xl bg-[#f3f4f6] px-3 py-1 text-sm font-semibold text-[#9ca3af]">DONE</span>}
                  </div>
                  <div className={`mt-4 rounded-xl py-2 text-center text-[14px] font-semibold ${isPast ? "bg-[#e5e7eb] text-[#6b7280]" : "bg-[#f08f26] text-white"}`}>
                    {isPast ? "View Recap" : "View Activity"}
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}