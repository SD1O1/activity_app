import { env } from "@/lib/env";

const adminUserIds = new Set(
  (env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export function isAdminUserId(userId: string | null | undefined) {
  if (!userId) return false;
  return adminUserIds.has(userId);
}

