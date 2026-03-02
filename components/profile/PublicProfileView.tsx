import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { ProfileCredibility } from "./ProfileCredibility";

const PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE = 50;
const INTEREST_STYLES = [
  "bg-orange-100 text-orange-600",
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-pink-100 text-pink-600",
  "bg-green-100 text-green-600",
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
      phone_verified,
      created_at
    `)
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
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("host_id", profile.id)
      .not("status", "eq", "deleted"),

    supabase
      .from("activity_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "active"),
  ]);

  const { data: hostedActivities } = await supabase
    .from("activities")
    .select(`
      id,
      title,
      type,
      starts_at,
      location_name,
      status,
      public_lat,
      public_lng
    `)
    .eq("host_id", profile.id)
    .not("status", "eq", "deleted")
    .order("starts_at", { ascending: true })
    .limit(PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE);

  return (
    <main className="min-h-screen bg-neutral-100 pb-12">
      <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6">
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
              <span
                key={interest}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${INTEREST_STYLES[index % INTEREST_STYLES.length]}`}
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {profile.bio && (
          <p className="mx-auto mt-4 max-w-2xl text-center text-xl leading-relaxed text-neutral-600 sm:text-2xl">
            {profile.bio}
          </p>
        )}

        <div className="mt-8">
          <ProfileCredibility hostedCount={hostedCount ?? 0} joinedCount={joinedCount ?? 0} />
        </div>

        <section className="mt-8 border-b border-neutral-200 pb-3">
          <h2 className="text-2xl font-semibold text-neutral-900">Hosted Activities</h2>
        </section>

        <section className="mt-4 space-y-3">
          {!hostedActivities || hostedActivities.length === 0 ? (
            <p className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
              No activities hosted yet.
            </p>
          ) : (
            hostedActivities.map((activity) => {
              const isDone = activity.status === "completed";

              return (
                <Link
                  key={activity.id}
                  href={`/activity/${activity.id}`}
                  className="block rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-semibold text-neutral-900">{activity.title}</h3>
                    {isDone && (
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Done
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">🕒 {new Date(activity.starts_at).toLocaleString()}</p>
                  {activity.location_name && <p className="mt-1 text-base text-neutral-500">📍 {activity.location_name}</p>}
                </Link>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
