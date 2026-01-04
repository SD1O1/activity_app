"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Message, Participant } from "./types";

export function useChat(
  open: boolean,
  activityId: string
) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
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

  /* LOAD DATA */
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const { data: convo } = await supabase
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId)
        .single();

      if (!convo) return;
      setConversationId(convo.id);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      const { data: parts } = await supabase
        .from("conversation_participants")
        .select("user_id, last_seen_at")
        .eq("conversation_id", convo.id);

      setParticipants(parts || []);
    };

    load();
  }, [open, activityId]);

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
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* REALTIME: PARTICIPANTS */
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
        (payload) => {
          const updated = payload.new as Participant;

          setParticipants((prev) => {
            const exists = prev.find(p => p.user_id === updated.user_id);
            return exists
              ? prev.map(p => p.user_id === updated.user_id ? updated : p)
              : [...prev, updated];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* FORCE RERENDER FOR SEEN */
  useEffect(() => {
    setMessages(prev => [...prev]);
  }, [participants]);

  /* TYPING */
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

  /* MARK SEEN */
  useEffect(() => {
    if (!open || !conversationId || !myId || messages.length === 0) return;

    const lastIncoming = [...messages]
      .reverse()
      .find(m => m.sender_id !== myId);

    if (!lastIncoming) return;

    supabase
      .from("conversation_participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", myId)
      .then(async () => {
        const { data } = await supabase
          .from("conversation_participants")
          .select("user_id, last_seen_at")
          .eq("conversation_id", conversationId);

        if (data) setParticipants(data);
      });
  }, [open, conversationId, myId, messages.length]);

  /* SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* MESSAGE META */
  const getMessageStatusText = (message: Message) => {
    if (!myId || message.sender_id !== myId) return null;

    const other = participants.find(p => p.user_id !== myId);
    const sentTime = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!other?.last_seen_at) return `Sent at ${sentTime}`;

    const seen =
      new Date(other.last_seen_at).getTime() >=
      new Date(message.created_at).getTime();

    return seen
      ? `Seen at ${new Date(other.last_seen_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : `Sent at ${sentTime}`;
  };

  /* SEND */
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
  };
}
