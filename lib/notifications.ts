import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationRow = {
  user_id: string;
  actor_id: string;
  type: string;
  message: string;
  activity_id: string | null;
};

export async function insertNotifications(
  admin: SupabaseClient,
  rows: NotificationRow[]
) {
  if (rows.length === 0) {
    return { error: null };
  }

  return admin.from("notifications").insert(rows);
}

export async function insertNotification(
  admin: SupabaseClient,
  row: NotificationRow
) {
  return admin.from("notifications").insert(row);
}