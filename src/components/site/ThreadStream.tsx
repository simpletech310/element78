"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/data/types";

/**
 * Renders a thread's messages live. Subscribes to Supabase realtime so new
 * inserts on `messages` (filtered by thread_id) append in place — no refresh.
 */
export function ThreadStream({
  threadId,
  viewerId,
  initial,
}: {
  threadId: string;
  viewerId: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message whenever the list grows.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => {
            // De-dupe: if this id already landed via the form action, skip.
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [threadId]);

  return (
    <div ref={scrollerRef} style={{ marginTop: 20, flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", paddingBottom: 12 }}>
      {messages.length === 0 ? (
        <div style={{ padding: "20px 0", color: "rgba(242,238,232,0.5)", fontSize: 13, textAlign: "center" }}>
          Say hi.
        </div>
      ) : (
        messages.map((m) => {
          const mine = m.sender_id === viewerId;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius: 14,
                background: mine ? "var(--sky)" : "var(--haze)",
                color: mine ? "var(--ink)" : "var(--bone)",
                border: mine ? "none" : "1px solid rgba(143,184,214,0.18)",
                fontSize: 14,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                animation: "msg-in 180ms ease-out",
              }}
            >
              {m.body}
              <div className="e-mono" style={{ marginTop: 6, fontSize: 9, letterSpacing: "0.14em", color: mine ? "rgba(10,14,20,0.6)" : "rgba(242,238,232,0.45)" }}>
                {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
          );
        })
      )}
      <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
