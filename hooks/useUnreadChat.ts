import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUnreadChat(activityId: string) {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("activity_id", activityId)
      .maybeSingle();

    if (!conversation) {
      setHasUnread(false);
      return;
    }

    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("last_seen_at")
      .eq("conversation_id", conversation.id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: latestMessage } = await supabase
      .from("messages")
      .select("created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      latestMessage &&
      (!participant?.last_seen_at ||
        new Date(latestMessage.created_at) >
          new Date(participant.last_seen_at))
    ) {
      setHasUnread(true);
    } else {
      setHasUnread(false);
    }
  }, [activityId]);

  useEffect(() => {
    checkUnread();
  }, [checkUnread]);

  return { hasUnread, checkUnread };
}