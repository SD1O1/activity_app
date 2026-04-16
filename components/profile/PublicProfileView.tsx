import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { ProfileCredibility } from "./ProfileCredibility";

const PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE = 50;
const INTEREST_STYLES = [
  "bg-orange-100 text-orange-600",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-200 text-orange-800",
  "bg-orange-50 text-orange-700",
];

function getAge(dob: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getActivityIcon(type: "group" | "one-on-one", status: string) {
  if (status === "completed") return { icon: "🎬", box: "bg-orange-100 text-orange-700" };
  return type === "group"
    ? { icon: "☕", box: "bg-orange-100 text-[#ee8c2b]" }
    : { icon: "🏋️", box: "bg-amber-100 text-amber-700" };
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
    .select(
      `
      id,
      username,
      name,
      bio,
      avatar_url,
      city,
      dob,
      interests,
      verified,
      phone_verified,
      created_at
    `
    )
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  if (viewer) {
    const { data: block } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${viewer.id},blocked_id.eq.${profile.id}),
         and(blocker_id.eq.${profile.id},blocked_id.eq.${viewer.id})`
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
    .select(
      `
      id,
      title,
      type,
      starts_at,
      location_name,
      status,
      public_lat,
      public_lng
    `
    )
    .eq("host_id", profile.id)
    .not("status", "eq", "deleted")
    .order("starts_at", { ascending: true })
    .limit(PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] pb-12">
      <section className="mx-auto w-full max-w-3xl px-4 pb-8 sm:px-6">
        <PublicProfileHeader
          name={profile.name}
          age={age}
          city={profile.city}
          avatarUrl={profile.avatar_url}
          verified={profile.verified}
          phoneVerified={profile.phone_verified}
          isSelf={isSelf}
          profileId={profile.id}
          username={profile.username}
        />

        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {profile.interests.map((interest: string, index: number) => (
              <span key={interest} className={`rounded-full px-4 py-1.5 text-sm font-bold ${INTEREST_STYLES[index % INTEREST_STYLES.length]}`}>
                {interest}
              </span>
            ))}
          </div>
        )}

        {profile.bio && <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-slate-600 sm:text-xl">{profile.bio}</p>}

        <div className="mt-8">
          <ProfileCredibility hostedCount={hostedCount ?? 0} joinedCount={joinedCount ?? 0} />
        </div>

        <section className="mt-8 border-b border-orange-100/80">
          <div className="grid grid-cols-2">
            <div className="border-b-[3px] border-[#ee8c2b] py-3 text-center text-lg font-bold text-slate-900 sm:text-2xl">Hosting</div>
            <div className="border-b-[3px] border-transparent py-3 text-center text-lg font-bold text-slate-400 sm:text-2xl">Joined</div>
          </div>
        </section>

        <section className="mt-4 space-y-4">
          {!hostedActivities || hostedActivities.length === 0 ? (
            <p className="rounded-2xl border border-orange-100/80 bg-orange-50/50 p-4 text-sm text-slate-500">No activities hosted yet.</p>
          ) : (
            hostedActivities.map((activity) => {
              const activityTheme = getActivityIcon(activity.type, activity.status);
              const isDone = activity.status === "completed";

              return (
                <Link
                  key={activity.id}
                  href={`/activity/${activity.id}`}
                  className="block rounded-3xl border border-orange-100/80 bg-white p-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.6)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`grid h-16 w-16 place-items-center rounded-2xl text-2xl ${activityTheme.box}`}>{activityTheme.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{activity.title}</h3>
                        <p className="mt-1 text-sm text-slate-500 sm:text-base">
                          🕒 {new Date(activity.starts_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {isDone && <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold uppercase text-slate-500">Done</span>}
                  </div>

                  <p className="mt-3 pl-[4.8rem] text-sm text-slate-500 sm:text-base">📍 {activity.location_name || "Location TBD"}</p>

                  <div className="mt-4 flex items-center gap-2 pl-[4.8rem]">
                    <span className={`flex-1 rounded-xl py-2 text-center text-base font-bold sm:text-xl ${isDone ? "bg-orange-100 text-slate-500" : "bg-[#ee8c2b] text-white"}`}>
                      {isDone ? "View Recap" : "Manage"}
                    </span>
                    {!isDone && <span className="grid h-11 w-11 place-items-center rounded-xl border border-orange-100 bg-orange-50 text-xl text-slate-600">💬</span>}
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
