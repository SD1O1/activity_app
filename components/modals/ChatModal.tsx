"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  activityId: string;
};

export default function ChatModal({ open, onClose, activityId }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------------------------
     Load conversation + messages
  --------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      // 1️⃣ Get conversation for activity
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("activity_id", activityId)
        .single();

      if (!conversation) return;

      setConversationId(conversation.id);

      // 2️⃣ Load messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
    };

    load();
  }, [open, activityId]);

  /* ---------------------------------------------
     Realtime messages
  --------------------------------------------- */
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  /* ---------------------------------------------
     Auto-scroll
  --------------------------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------------------------------------
     Send message
  --------------------------------------------- */
  const send = async () => {
    if (!text.trim() || !conversationId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text.trim(),
    });

    setText("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Activity Chat</h2>
          <button onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-medium">{m.sender_id}</span>:{" "}
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
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