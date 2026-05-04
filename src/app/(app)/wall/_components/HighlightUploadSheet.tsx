"use client";

import { useRef, useState, useTransition } from "react";
import { createHighlightAction } from "@/lib/wall-actions";
import { SheetPortal } from "./SheetPortal";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_S = 60;

export function HighlightUploadSheet({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("Highlights are video only.");
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      setError("Video is over 50MB.");
      return;
    }
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      if (v.duration > MAX_VIDEO_DURATION_S + 0.5) {
        setError(`Video is ${Math.round(v.duration)}s — keep highlights ≤60s.`);
        setFile(null);
      }
    };
    v.src = url;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !file) return;
    const fd = new FormData();
    fd.append("media", file);
    startTransition(async () => {
      try {
        await createHighlightAction(fd);
        onClose();
      } catch {
        setError("Couldn't upload. Try again.");
      }
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
      onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: "var(--paper)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          height: "min(90dvh, 720px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(10,14,20,0.06)", flexShrink: 0 }}>
          <div className="e-display" style={{ fontSize: 18 }}>NEW HIGHLIGHT · 24H</div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div className="e-mono" style={{ fontSize: 10, color: "rgba(10,14,20,0.6)" }}>
            VIDEO ONLY · MAX 60S · MAX 50MB · DISAPPEARS IN 24H
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn btn-ink"
            style={{ padding: "10px 16px", alignSelf: "flex-start" }}
          >
            {file ? "REPLACE VIDEO" : "PICK VIDEO"}
          </button>

          {preview && (
            <div style={{ borderRadius: 12, overflow: "hidden", maxHeight: 360, background: "#000" }}>
              <video src={preview} controls playsInline style={{ width: "100%", maxHeight: 360 }} />
            </div>
          )}
          {error && <div className="e-mono" style={{ fontSize: 11, color: "var(--rose)" }}>{error}</div>}
        </div>

        <div style={{ padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid rgba(10,14,20,0.06)", display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0, background: "var(--paper)" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="e-tag"
            style={{ padding: "10px 16px", borderRadius: 999, background: "transparent", border: "1px solid rgba(10,14,20,0.2)", cursor: "pointer" }}
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={pending || !file}
            className="btn btn-sky"
            style={{ padding: "10px 18px", opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "UPLOADING…" : "POST HIGHLIGHT"}
          </button>
        </div>
      </form>
    </div>
    </SheetPortal>
  );
}
