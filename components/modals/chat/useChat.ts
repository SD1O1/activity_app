"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Message, Participant } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";
type ParticipantWithAvatar = Participant & {
  avatar_url?: string | null;
  username?: string | null;
};

export function useChat(open: boolean, activityId: string) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithAvatar[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const participantsRef = useRef<ParticipantWithAvatar[]>([]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const syncParticipantSeen = (userId: string, seenAt: string | null) => {
    setParticipants(prev => {
      let changed = false;
      const next = prev.map(p => {
        if (p.user_id !== userId) return p;
        if (p.last_seen_at === seenAt) return p;
        changed = true;
        return { ...p, last_seen_at: seenAt };
      });
      return changed ? next : prev;
    });
  };

  /* ───────── AUTH ───────── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id ?? null);
    });
  }, []);

  /* ───────── LOAD CHAT DATA ───────── */
  useEffect(() => {
    if (!open || !activityId || !myId) return;

    const load = async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId);

      if (!convos?.length) return;

      const convoId = convos[0].id;
      setConversationId(convoId);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id, last_seen_at")
        .eq("conversation_id", convoId);

      if (!parts) return;

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

  /* ───────── REALTIME: MESSAGES ───────── */
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
          const incoming = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* ───────── MARK SEEN (CORRECT + SAFE) ───────── */
  useEffect(() => {
    if (!open || !conversationId || !myId || messages.length === 0) return;

    const lastIncoming = [...messages]
      .reverse()
      .find(m => m.sender_id !== myId);

    if (!lastIncoming) return;

    const me = participantsRef.current.find(p => p.user_id === myId);

    if (
      me?.last_seen_at &&
      new Date(me.last_seen_at) >= new Date(lastIncoming.created_at)
    ) {
      return;
    }

    const seenAt = lastIncoming.created_at;

    void fetch("/api/chat/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        seenAt,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("chat seen update failed", {
            status: res.status,
            body: await res.text(),
          });
          return;
        }

        syncParticipantSeen(myId, seenAt);
      })
      .catch((error) => {
        console.error("chat seen request error", error);
      });
  }, [open, conversationId, myId, messages]);

  /* ───────── REALTIME: SEEN SYNC ───────── */
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
          syncParticipantSeen(payload.new.user_id, payload.new.last_seen_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

    /* ───────── FALLBACK: POLL PARTICIPANT SEEN ───────── */
    useEffect(() => {
      if (!open || !conversationId) return;
  
      const refreshParticipants = async () => {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id, last_seen_at")
          .eq("conversation_id", conversationId);
  
        if (!parts?.length) return;
  
        parts.forEach((part) => {
          syncParticipantSeen(part.user_id, part.last_seen_at);
        });
      };
  
      void refreshParticipants();
      const interval = window.setInterval(() => {
        void refreshParticipants();
      }, 4000);
  
      return () => {
        window.clearInterval(interval);
      };
    }, [open, conversationId]);

  /* ───────── TYPING INDICATOR ───────── */
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

  /* ───────── SCROLL ──────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ───────── MESSAGE STATUS ───────── */
  const getMessageStatusText = (message: Message) => {
    if (!myId || message.sender_id !== myId) return null;

    const sentTime = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const other = participants.find(p => p.user_id !== myId);
    if (!other?.last_seen_at) return `Sent at ${sentTime}`;

    const seenAt = new Date(other.last_seen_at);
    if (seenAt < new Date(message.created_at)) {
      return `Sent at ${sentTime}`;
    }

    return `Seen at ${seenAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  /* ───────── SEND MESSAGE (NO NOTIFICATION HERE) ───────── */
  const send = async () => {
    if (!text.trim() || !conversationId || !myId) return;
    setSendError(null);

    const content = text.trim();
    setText("");

    const { data: msg, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: myId,
        content,
      })
      .select()
      .single();

      if (insertError || !msg) {
        setSendError(insertError?.message || "Failed to send message");
        return;
      }

    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    // 🔔 notify server (server resolves recipients reliably)
    void fetch("/api/notifications/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        activityId,
        messageCreatedAt: msg.created_at,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        console.error("chat notification failed", {
          status: res.status,
          body: await res.text(),
        });
      }
    }).catch((error) => {
      console.error("chat notification request error", error);
    });

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
    sendError,
  };
}