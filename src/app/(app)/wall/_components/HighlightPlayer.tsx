"use client";

import { useEffect, useRef, useState } from "react";
import type { HydratedHighlight } from "@/lib/data/types";

const MAX_SEGMENT_MS = 8000; // hard cap per clip if metadata never loads

export function HighlightPlayer({
  stack,
  onClose,
}: {
  stack: HydratedHighlight[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 of the current clip
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const durationMsRef = useRef<number>(MAX_SEGMENT_MS);

  const current = stack[index];

  // Reset timer when index changes.
  useEffect(() => {
    setProgress(0);
    startedAtRef.current = Date.now();
    pausedAtRef.current = null;
    durationMsRef.current = MAX_SEGMENT_MS;
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {/* autoplay may be blocked silently */});
    }
  }, [index]);

  // Ticker — drives the progress bar and advances the stack on completion.
  useEffect(() => {
    function tick() {
      if (pausedAtRef.current === null) {
        const elapsed = Date.now() - startedAtRef.current;
        const dur = durationMsRef.current || MAX_SEGMENT_MS;
        const p = Math.min(1, elapsed / dur);
        setProgress(p);
        if (p >= 1) {
          if (index + 1 < stack.length) {
            setIndex(index + 1);
          } else {
            onClose();
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [index, stack.length, onClose]);

  // Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function next() {
    if (index + 1 < stack.length) setIndex(index + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
    else {
      // restart current
      setIndex(index);
      startedAtRef.current = Date.now();
      setProgress(0);
      videoRef.current?.play().catch(() => {});
    }
  }

  function onPointerDown() {
    pausedAtRef.current = Date.now();
    videoRef.current?.pause();
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (pausedAtRef.current !== null) {
      const pausedFor = Date.now() - pausedAtRef.current;
      startedAtRef.current += pausedFor;
      pausedAtRef.current = null;
      videoRef.current?.play().catch(() => {});
    }
    // Treat brief taps as advance/back depending on which side was tapped.
    const target = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - target.left;
    if (x > target.width / 2) next();
    else prev();
  }

  function onLoadedMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget;
    if (v.duration && Number.isFinite(v.duration)) {
      durationMsRef.current = Math.min(MAX_SEGMENT_MS, Math.round(v.duration * 1000));
    }
  }

  if (!current) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "#000",
        color: "var(--bone)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top progress + meta */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 14px", zIndex: 2 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {stack.map((_, i) => {
            const filled = i < index ? 1 : i === index ? progress : 0;
            return (
              <div key={i} style={{ flex: 1, height: 2.5, background: "rgba(255,255,255,0.25)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${filled * 100}%`, height: "100%", background: "var(--bone)" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div className="e-display" style={{ fontSize: 16 }}>
            {(current.author?.display_name ?? "MEMBER").toUpperCase()}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "var(--bone)", border: "none", cursor: "pointer", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Tappable video surface */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pausedAtRef.current = null; videoRef.current?.play().catch(() => {}); }}
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}
      >
        <video
          ref={videoRef}
          src={current.media_url}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={onLoadedMeta}
          onEnded={next}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
        />
      </div>
    </div>
  );
}
