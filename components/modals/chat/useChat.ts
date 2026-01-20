"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Message, Participant } from "./types";

type ParticipantWithAvatar = Participant & {
  avatar_url?: string | null;
};

export function useChat(open: boolean, activityId: string) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithAvatar[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingChannelRef = useRef<any>(null);

  /* AUTH */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id ?? null);
    });
  }, []);

  /* LOAD CHAT DATA */
  useEffect(() => {
    if (!open || !activityId || !myId) return;

    const load = async () => {
      // 1️⃣ Get conversation
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId);

      if (error || !convos || convos.length === 0) return;

      const convoId = convos[0].id;
      setConversationId(convoId);

      // 2️⃣ Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      // 3️⃣ Load participants (NO JOIN)
      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id, last_seen_at")
        .eq("conversation_id", convoId);

      if (!parts || parts.length === 0) {
        setParticipants([]);
        return;
      }

      // 4️⃣ Load avatars separately
      const userIds = parts.map(p => p.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, avatar_url, username")
        .in("id", userIds);

        const profileMap = new Map(
          (profiles || []).map(p => [
            p.id,
            { avatar_url: p.avatar_url, username: p.username },
          ])
        );
        
        setParticipants(
          parts.map(p => ({
            user_id: p.user_id,
            last_seen_at: p.last_seen_at,
            avatar_url: profileMap.get(p.user_id)?.avatar_url ?? null,
            username: profileMap.get(p.user_id)?.username ?? null,
          }))
        );
        
    };

    load();
  }, [open, activityId, myId]);

  /* REALTIME: MESSAGES */
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* REALTIME: PARTICIPANTS (SEEN UPDATES) */
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`participants-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const updated = payload.new as Participant;

          setParticipants(prev =>
            prev.map(p =>
              p.user_id === updated.user_id
                ? { ...p, last_seen_at: updated.last_seen_at }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* MARK SEEN (ONLY WHEN CHAT IS OPEN) */
  useEffect(() => {
    if (!open) return;
    if (!conversationId || !myId || messages.length === 0) return;

    const lastIncoming = [...messages]
      .reverse()
      .find(m => m.sender_id !== myId);

    if (!lastIncoming) return;

    supabase
      .from("conversation_participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", myId);
  }, [open, conversationId, myId, messages.length]);

  /* TYPING INDICATOR */
  useEffect(() => {
    if (!conversationId || !myId) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: { presence: { key: myId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const others = Object.keys(state).filter(id => id !== myId);
      setIsOtherTyping(others.length > 0);
    });

    channel.subscribe();
    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [conversationId, myId]);

  /* SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* MESSAGE META (Seen / Sent — last message only) */
  const getMessageStatusText = (message: Message) => {
    if (!myId || message.sender_id !== myId) return null;
  
    const sentTime = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    const other = participants.find(p => p.user_id !== myId);
  
    if (!other?.last_seen_at) {
      return `Sent at ${sentTime}`;
    }
  
    const seenAt = new Date(other.last_seen_at);
  
    const isSeen =
      seenAt.getTime() >= new Date(message.created_at).getTime();
  
    if (!isSeen) {
      return `Sent at ${sentTime}`;
    }
  
    const seenTime = seenAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    return `Seen at ${seenTime}`;
  };  

  /* SEND MESSAGE */
  const send = async () => {
    if (!text.trim() || !conversationId || !myId) return;

    const content = text.trim();
    setText("");

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: myId,
        content,
      })
      .select()
      .single();

    if (data) setMessages(prev => [...prev, data]);

    typingChannelRef.current?.untrack();
  };

  return {
    messages,
    text,
    setText,
    isOtherTyping,
    send,
    bottomRef,
    getMessageStatusText,
    myId,
    participants,
  };
}