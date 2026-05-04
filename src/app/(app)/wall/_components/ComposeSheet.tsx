"use client";

import { useRef, useState, useTransition } from "react";
import { createPostAction } from "@/lib/wall-actions";

const KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "progress", label: "Progress" },
  { value: "milestone", label: "Milestone / PR" },
  { value: "event", label: "Event" },
  { value: "open_mic", label: "Open mic" },
  { value: "challenge", label: "Challenge" },
  { value: "trainer_drop", label: "Trainer drop" },
  { value: "announcement", label: "Announcement" },
];

const MAX_BODY = 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_S = 60;

export function ComposeSheet({ onClose }: { onClose: () => void }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("progress");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setPreviewKind(null);
    setError(null);
    if (!f) return;

    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Pick an image or video.");
      return;
    }
    if (isImage && f.size > MAX_IMAGE_BYTES) {
      setError("Image is over 10MB.");
      return;
    }
    if (isVideo && f.size > MAX_VIDEO_BYTES) {
      setError("Video is over 50MB.");
      return;
    }
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setPreviewKind(isImage ? "image" : "video");

    if (isVideo) {
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
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!body.trim() && !file) {
      setError("Write something or attach media.");
      return;
    }
    const fd = new FormData();
    fd.append("body", body.trim());
    fd.append("kind", kind);
    if (file) fd.append("media", file);
    startTransition(async () => {
      try {
        await createPostAction(fd);
        // createPostAction redirects on success; if we get here, just close.
        onClose();
      } catch (err) {
        setError("Couldn't post. Try again.");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
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
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(10,14,20,0.06)" }}>
          <div className="e-display" style={{ fontSize: 18 }}>NEW POST</div>
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

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            placeholder="Share something with the family…"
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              background: "var(--bone)",
              border: "1px solid rgba(10,14,20,0.1)",
              fontSize: 14,
              fontFamily: "var(--font-body, inherit)",
              resize: "vertical",
              outline: "none",
            }}
          />
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", textAlign: "right" }}>
            {body.length}/{MAX_BODY}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label className="e-mono" style={{ fontSize: 10, color: "rgba(10,14,20,0.6)" }}>KIND</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 999, background: "var(--bone)", border: "1px solid rgba(10,14,20,0.1)", fontSize: 13 }}
            >
              {KIND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-ink"
              style={{ padding: "9px 14px" }}
            >
              {file ? "REPLACE MEDIA" : "ADD PHOTO OR VIDEO"}
            </button>
            {file && (
              <button
                type="button"
                onClick={() => pickFile(null)}
                style={{ marginLeft: 8, background: "transparent", border: "1px solid rgba(10,14,20,0.2)", padding: "9px 14px", borderRadius: 999, fontSize: 11, cursor: "pointer" }}
                className="e-tag"
              >
                REMOVE
              </button>
            )}
          </div>

          {preview && previewKind === "image" && (
            <div style={{ borderRadius: 12, overflow: "hidden", maxHeight: 280 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
            </div>
          )}
          {preview && previewKind === "video" && (
            <div style={{ borderRadius: 12, overflow: "hidden", maxHeight: 280, background: "#000" }}>
              <video src={preview} controls playsInline style={{ width: "100%", maxHeight: 280 }} />
            </div>
          )}

          {error && (
            <div className="e-mono" style={{ fontSize: 11, color: "var(--rose)" }}>{error}</div>
          )}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid rgba(10,14,20,0.06)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
            disabled={pending || (!body.trim() && !file)}
            className="btn btn-sky"
            style={{ padding: "10px 18px", opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "POSTING…" : "POST"}
          </button>
        </div>
      </form>
    </div>
  );
}
