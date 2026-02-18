import { PublicUser } from "@/types/publicUser";

export type ActivityTag = {
  id: string;
  name: string;
};

export type ActivityTagRelation = {
  activity_tags: ActivityTag | ActivityTag[] | null;
};

export function normalizeActivityTags(
  relations: ActivityTagRelation[] | null | undefined
): ActivityTag[] {
  if (!relations?.length) return [];

  return relations.flatMap((relation) => {
    if (!relation?.activity_tags) return [];

    return Array.isArray(relation.activity_tags)
      ? relation.activity_tags
      : [relation.activity_tags];
  });
}

export type ActivityListItem = {
  id: string;
  title: string;
  type: "group" | "one-on-one";
  starts_at: string;
  location_name: string;
  public_lat: number | null;
  public_lng: number | null;
  host_id: string;
  category?: string | null;
  activity_tag_relations: ActivityTagRelation[] | null;
  host: PublicUser | null;
};

export type ActivityDetailItem = ActivityListItem & {
  description: string;
  status: string;
  cost_rule: string;
  exact_lat: number | null;
  exact_lng: number | null;
  questions: string[] | null;
  member_count: number;
  max_members: number;
};