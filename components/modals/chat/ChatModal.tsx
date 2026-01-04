"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Message, Participant } from "./types";


type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  onChatClosed?: () => void;
};

export default function ChatModal({
  open,
  onClose,
  activityId,
  onChatClosed,
}: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingChannelRef = useRef<any>(null);

  /* ---------------------------------------------
     AUTH
  --------------------------------------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id ?? null);
    });
  }, []);

  /* ---------------------------------------------
     LOAD CONVERSATION + DATA
  --------------------------------------------- */
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

  /* ---------------------------------------------
     REALTIME: MESSAGES
  --------------------------------------------- */
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
          const newMessage = payload.new as Message;
        
          setMessages((prev) => [...prev, newMessage]);
        }        
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* ---------------------------------------------
     REALTIME: PARTICIPANTS (SEEN)
  --------------------------------------------- */
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
          
            if (exists) {
              return prev.map(p =>
                p.user_id === updated.user_id ? updated : p
              );
            }
          
            return [...prev, updated];
          });          
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    // force rerender so Seen/Sent recalculates
    setMessages((prev) => [...prev]);
  }, [participants]);
  
  /* ---------------------------------------------
     TYPING INDICATOR
  --------------------------------------------- */
  useEffect(() => {
    if (!conversationId || !myId) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: { presence: { key: myId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const others = Object.keys(state).filter((id) => id !== myId);
      setIsOtherTyping(others.length > 0);
    });

    channel.subscribe();
    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [conversationId, myId]);

  /* ---------------------------------------------
     MARK CHAT AS SEEN (CRITICAL)
  --------------------------------------------- */
  useEffect(() => {
    if (!open || !conversationId || !myId || messages.length === 0) return;
  
    const lastIncoming = [...messages]
      .reverse()
      .find((m) => m.sender_id !== myId);
  
    if (!lastIncoming) return;
  
    const updateSeen = async () => {
      await supabase
        .from("conversation_participants")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", myId);
  
      // 🔥 FORCE REFRESH (this is what you were missing)
      const { data } = await supabase
        .from("conversation_participants")
        .select("user_id, last_seen_at")
        .eq("conversation_id", conversationId);
  
      if (data) setParticipants(data);
    };
  
    updateSeen();
  }, [open, conversationId, myId, messages.length]);    
  
  /* ---------------------------------------------
     AUTO SCROLL
  --------------------------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------------------------------------
     MESSAGE STATUS TEXT
  --------------------------------------------- */
  const getMessageStatusText = (message: Message) => {
    if (!myId || message.sender_id !== myId) return null;

    const other = participants.find((p) => p.user_id !== myId);

    const sentTime = new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!other?.last_seen_at) {
      return `Sent at ${sentTime}`;
    }

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

  /* ---------------------------------------------
     SEND MESSAGE
  --------------------------------------------- */
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

    if (data) {
      setMessages((prev) => [...prev, data]);
    }

    typingChannelRef.current?.untrack();
  };

  if (!open) return null;  

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Activity Chat</h2>
          <button
            onClick={() => {
              onClose();
              onChatClosed?.();
            }}
            className="text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((m, index) => {
            const isMe = m.sender_id === myId;
            const next = messages[index + 1];
            const showMeta = !next || next.sender_id !== m.sender_id;

            return (
              <div key={m.id} className="mb-2">
                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl ${
                      isMe
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>

                {isMe && showMeta && (
                  <div className="text-[11px] italic text-gray-400 text-right pr-2 mt-1">
                    {getMessageStatusText(m)}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Typing */}
        {isOtherTyping && (
          <div className="px-4 pb-1 text-xs text-gray-500 italic">
            Someone is typing…
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              typingChannelRef.current?.track({ typing: true });
            }}
            placeholder="Type a message..."
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={send}
            className="bg-black text-white rounded-xl px-4"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}