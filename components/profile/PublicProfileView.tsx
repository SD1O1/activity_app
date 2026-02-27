import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { ProfileCredibility } from "./ProfileCredibility";
import Link from "next/link";

const PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE = 50;

/* Utility to calculate age */
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

export async function PublicProfileView({
  username,
}: PublicProfileViewProps) {
  const supabase = await createSupabaseServer();

  /* 1️⃣ Viewer (may be null) */
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  /* 2️⃣ Fetch profile */
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

  if (error || !profile) {
    notFound();
  }

  /* 3️⃣ Blocking enforcement */
  if (viewer) {
    const { data: block } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${viewer.id},blocked_id.eq.${profile.id}),
         and(blocker_id.eq.${profile.id},blocked_id.eq.${viewer.id})`
      )
      .maybeSingle();

    if (block) {
      notFound();
    }
  }

  const isSelf = viewer?.id === profile.id;
  const age = getAge(profile.dob);

  /* 4️⃣ Credibility counts */
  const [{ count: hostedCount }, { count: joinedCount }] =
    await Promise.all([
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

  /* 5️⃣ Hosted activities (public-safe) */
  const { data: hostedActivities } = await supabase
    .from("activities")
    .select(`
      id,
      title,
      type,
      starts_at,
      location_name,
      public_lat,
      public_lng
    `)
    .eq("host_id", profile.id)
    .not("status", "eq", "deleted")
    .order("starts_at", { ascending: true })
    .limit(PUBLIC_HOSTED_ACTIVITY_PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
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

      <ProfileCredibility
        hostedCount={hostedCount ?? 0}
        joinedCount={joinedCount ?? 0}
      />

      {/* About */}
      {profile.bio && (
        <div>
          <h2 className="font-medium mb-1">About</h2>
          <p className="text-gray-700">{profile.bio}</p>
        </div>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div>
          <h2 className="font-medium mb-2">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest: string) => (
              <span
                key={interest}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hosted activities */}
      <div>
        <h2 className="font-medium mb-2">
          Hosted activities
        </h2>

        {!hostedActivities || hostedActivities.length === 0 ? (
          <p className="text-sm text-gray-500">
            No activities hosted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {hostedActivities.map((activity) => (
              <Link
              key={activity.id}
              href={`/activity/${activity.id}`}
              className="block rounded-lg border p-3 hover:bg-gray-50"
            >
              <h3 className="font-medium">
                {activity.title}
              </h3>
            
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.starts_at).toLocaleString()}
              </p>
            
              {activity.location_name && (
                <p className="text-xs text-gray-400 mt-1">
                  📍 {activity.location_name}
                </p>
              )}
            </Link>            
            ))}
          </div>
        )}
      </div>
    </div>
  );
}