"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const SUPABASE = "https://xiimrgdfbucpwugxmkrm.supabase.co";
const VIDEO_URL = `${SUPABASE}/storage/v1/object/public/media/welcome.mp4`;
const POSTER_URL = `${SUPABASE}/storage/v1/object/public/media/welcome-poster.jpg`;

function fmtTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export function FilmTrigger() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
    setPlaying(false);
  }, []);

  // ESC closes; lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-play on open (muted to satisfy autoplay policies)
  useEffect(() => {
    if (!open) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setMuted(true);
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [open]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }
  function onLoaded() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}
        aria-label="Watch the Element 78 film"
      >
        <Icon name="play" size={12} />
        WATCH FILM
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Element 78 — Welcome film"
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(5,7,12,0.92)", backdropFilter: "blur(18px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(16px, 4vw, 40px)",
            animation: "modalIn .35s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {/* ambient glow */}
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% 30%, rgba(143,184,214,0.18), transparent 60%)",
          }} />

          {/* header */}
          <div style={{ position: "absolute", top: 22, left: 22, right: 22, display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--bone)", pointerEvents: "none" }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.3em" }}>◉ FILM · 0:13</div>
              <div className="e-display" style={{ fontSize: 22, marginTop: 4 }}>WELCOME TO ELEMENT.</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label="Close film"
              style={{
                pointerEvents: "auto",
                width: 44, height: 44, borderRadius: 999,
                background: "rgba(10,14,20,0.65)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(143,184,214,0.3)",
                color: "var(--bone)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform .2s ease, background .2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "rotate(90deg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "rotate(0)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* player frame */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(560px, 100%)",
              maxHeight: "calc(100dvh - 200px)",
              borderRadius: 24,
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(143,184,214,0.25), 0 0 80px rgba(77,169,214,0.18)",
              animation: "frameIn .45s cubic-bezier(.2,.8,.2,1) .05s both",
            }}
          >
            <video
              ref={videoRef}
              src={VIDEO_URL}
              poster={POSTER_URL}
              playsInline
              autoPlay
              muted
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoaded}
              onClick={togglePlay}
              style={{ width: "100%", height: "100%", display: "block", maxHeight: "calc(100dvh - 200px)", objectFit: "contain", background: "#000", cursor: "pointer" }}
            />

            {/* center play button when paused */}
            {!playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play film"
                style={{
                  position: "absolute", inset: 0, margin: "auto",
                  width: 80, height: 80, borderRadius: 999,
                  background: "var(--sky)", color: "var(--ink)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 8px rgba(143,184,214,0.18), 0 0 40px rgba(77,169,214,0.4)",
                  animation: "pulseSky 2s ease-in-out infinite",
                }}
              >
                <Icon name="play" size={28} />
              </button>
            )}

            {/* controls */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              padding: "20px 18px 16px",
              background: "linear-gradient(180deg, transparent, rgba(10,14,20,0.85))",
              color: "var(--bone)",
            }}>
              {/* scrubber */}
              <div
                onClick={seek}
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                style={{
                  position: "relative",
                  height: 4, borderRadius: 2,
                  background: "rgba(255,255,255,0.18)",
                  cursor: "pointer", marginBottom: 12,
                }}
              >
                <div style={{ position: "absolute", inset: 0, width: `${progress}%`, background: "var(--sky)", borderRadius: 2, boxShadow: "0 0 10px rgba(143,184,214,0.6)" }} />
                <div style={{ position: "absolute", left: `${progress}%`, top: "50%", width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: "50%", background: "var(--bone)", boxShadow: "0 0 0 2px var(--sky)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} style={ctrlBtnStyle}>
                  {playing ? <Icon name="pause" size={16} /> : <Icon name="play" size={16} />}
                </button>
                <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.7)", minWidth: 88, letterSpacing: "0.1em" }}>
                  {fmtTime(current)} <span style={{ color: "rgba(242,238,232,0.4)" }}>/ {fmtTime(duration)}</span>
                </div>
                <div style={{ flex: 1 }} />
                <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={ctrlBtnStyle}>
                  {muted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M11 5L6 9H3v6h3l5 4V5z" />
                      <path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* footer caption */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", pointerEvents: "none" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.3em" }}>
              ESC TO CLOSE · SPACE TO PLAY/PAUSE
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes frameIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes pulseSky {
          0%, 100% { box-shadow: 0 0 0 8px rgba(143,184,214,0.18), 0 0 40px rgba(77,169,214,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(143,184,214,0.08), 0 0 60px rgba(77,169,214,0.55); }
        }
      `}</style>
    </>
  );
}

const ctrlBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
