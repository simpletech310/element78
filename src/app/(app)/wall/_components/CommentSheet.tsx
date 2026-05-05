"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
import type { HydratedComment } from "@/lib/data/types";
import { createCommentAction } from "@/lib/wall-actions";
import { relativeTime } from "./relative-time";
import { SheetPortal } from "./SheetPortal";

export function CommentSheet({
  postId,
  onClose,
  onCountChange,
}: {
  postId: string;
  onClose: () => void;
  onCountChange?: (n: number) => void;
}) {
  const [comments, setComments] = useState<HydratedComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/wall/posts/${postId}/comments`, { cache: "no-store" });
      if (!res.ok) throw new Error("load_failed");
      const json = (await res.json()) as { comments: HydratedComment[] };
      setComments(json.comments);
      onCountChange?.(json.comments.length);
    } catch {
      setError("Couldn't load comments.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const fd = new FormData();
    fd.append("post_id", postId);
    fd.append("body", text);
    startTransition(async () => {
      await createCommentAction(fd);
      setBody("");
      await load();
      inputRef.current?.focus();
    });
  }

  return (
    <SheetPortal>
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,14,20,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--paper)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          height: "min(82dvh, 720px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(10,14,20,0.06)", flexShrink: 0 }}>
          <div className="e-display" style={{ fontSize: 18 }}>COMMENTS</div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11 }}>{error}</div>}
          {!comments && !error && (
            <div className="e-mono" style={{ fontSize: 11, color: "rgba(10,14,20,0.5)" }}>LOADING…</div>
          )}
          {comments && comments.length === 0 && (
            <div className="e-mono" style={{ fontSize: 11, color: "rgba(10,14,20,0.5)" }}>BE THE FIRST TO REPLY.</div>
          )}
          {comments?.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AvatarCircle src={c.author?.avatar_url} name={c.author?.display_name} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>{(c.author?.display_name ?? "MEMBER").toUpperCase()}</span>
                  <span className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>{relativeTime(c.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 2, whiteSpace: "pre-wrap" }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={submit}
          style={{ padding: "10px 12px calc(12px + env(safe-area-inset-bottom))", display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid rgba(10,14,20,0.06)", flexShrink: 0, background: "var(--paper)" }}
        >
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply…"
            maxLength={1000}
            style={{ flex: 1, padding: "11px 14px", borderRadius: 999, background: "var(--bone)", border: "1px solid rgba(10,14,20,0.1)", fontSize: 13, outline: "none" }}
          />
          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="btn btn-sky"
            style={{ padding: "9px 14px", opacity: pending || body.trim().length === 0 ? 0.5 : 1 }}
          >
            POST
          </button>
        </form>
      </div>
    </div>
    </SheetPortal>
  );
}
