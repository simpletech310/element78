"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const SUPABASE = "https://xiimrgdfbucpwugxmkrm.supabase.co";
const VIDEO_URL = `${SUPABASE}/storage/v1/object/public/media/flow.mp4`;
const POSTER_URL = `${SUPABASE}/storage/v1/object/public/media/flow-poster.jpg`;

const HOLD_SECONDS = 23;
const SETS_TOTAL = 3;
const REPS_TARGET = 12;
const TOTAL_MOVES = 11;
const CURRENT_MOVE = 4;

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

type LoadState = "idle" | "loading" | "ready" | "error";

export function FlowPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [setIndex, setSetIndex] = useState(1);
  const [reps, setReps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bpm, setBpm] = useState(142);

  // Tick: countdown + stats. When timer hits 0, stop video and advance the set.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // hold complete → stop the video, advance set
          const v = videoRef.current;
          if (v) { v.pause(); v.currentTime = 0; }
          setPlaying(false);
          setSetIndex((i) => (i >= SETS_TOTAL ? SETS_TOTAL : i + 1));
          return HOLD_SECONDS;
        }
        return s - 1;
      });
      setElapsed((t) => t + 1);
      setReps((r) => (r >= REPS_TARGET ? r : r + (Math.random() > 0.4 ? 1 : 0)));
      setBpm((b) => Math.max(132, Math.min(168, b + Math.round((Math.random() - 0.5) * 4))));
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  function play() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    v.play().then(() => setPlaying(true)).catch(() => {
      // If autoplay was blocked, try again unmuted to surface the user gesture path.
      v.muted = false;
      setMuted(false);
      v.play().then(() => setPlaying(true)).catch(() => setLoadState("error"));
    });
  }
  function pause() {
    const v = videoRef.current;
    if (v) v.pause();
    setPlaying(false);
  }
  function togglePlay() { playing ? pause() : play(); }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function reset() {
    pause();
    setSecondsLeft(HOLD_SECONDS);
    setSetIndex(1);
    setReps(0);
    setElapsed(0);
    const v = videoRef.current;
    if (v) v.currentTime = 0;
  }
  function retryLoad() {
    setLoadState("loading");
    const v = videoRef.current;
    if (v) v.load();
  }

  // ring math
  const RING_R = 28;
  const RING_C = 2 * Math.PI * RING_R;
  const ringDashoffset = RING_C * (1 - secondsLeft / HOLD_SECONDS);
  const overallPct = Math.min(1, (setIndex - 1 + (1 - secondsLeft / HOLD_SECONDS)) / SETS_TOTAL);

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, padding: "20px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/train" aria-label="Back" style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(143,184,214,0.06)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.25)" }}>
          <Icon name="chevronDown" size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(143,184,214,0.06)", border: "1px solid rgba(143,184,214,0.25)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: playing ? "var(--sky)" : "rgba(242,238,232,0.4)", animation: playing ? "pulseDot 2s infinite" : "none" }} />
          <span className="e-tag">AI GUIDE · ZURI</span>
        </div>
        <button onClick={reset} aria-label="Reset" style={ctrlChrome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
            <path d="M3 4v5h5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* PROMINENT VIDEO BOX */}
      <div style={{ flex: 1, padding: "8px 22px 0", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          position: "relative",
          flex: "1 1 auto",
          minHeight: 280,
          maxHeight: "60vh",
          borderRadius: 22,
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 30px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(143,184,214,0.18)",
        }}>
          <video
            ref={videoRef}
            src={VIDEO_URL}
            poster={POSTER_URL}
            muted={muted}
            loop
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onLoadedData={() => setLoadState("ready")}
            onCanPlay={() => setLoadState((s) => (s === "error" ? "ready" : s))}
            onWaiting={() => setLoadState((s) => (s === "ready" ? s : "loading"))}
            onError={() => setLoadState("error")}
            onEnded={() => { /* loop handles this */ }}
            onClick={togglePlay}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              cursor: "pointer",
              background: "#000",
            }}
          />

          {/* Loading state */}
          {loadState === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,14,20,0.4)", backdropFilter: "blur(2px)", pointerEvents: "none" }}>
              <div style={{ width: 36, height: 36, border: "2px solid rgba(143,184,214,0.25)", borderTopColor: "var(--sky)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {/* Error state */}
          {loadState === "error" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(10,14,20,0.85)", padding: 20, textAlign: "center" }}>
              <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.25em" }}>VIDEO COULDN&apos;T LOAD</div>
              <button onClick={retryLoad} className="btn btn-sky" style={{ padding: "10px 18px", fontSize: 10 }}>RETRY</button>
            </div>
          )}

          {/* Center play overlay (only when paused and ready) */}
          {!playing && loadState !== "error" && (
            <button
              type="button"
              onClick={play}
              aria-label="Play"
              style={{
                position: "absolute", inset: 0, margin: "auto",
                width: 76, height: 76, borderRadius: 999,
                background: "var(--sky)", color: "var(--ink)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 8px rgba(143,184,214,0.18), 0 0 40px rgba(77,169,214,0.45)",
                animation: "pulseSky 2s ease-in-out infinite",
              }}
            >
              <Icon name="play" size={28} />
            </button>
          )}

          {/* TOP-RIGHT: small timer overlay */}
          <div style={{
            position: "absolute", top: 12, right: 12,
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px 8px 8px",
            borderRadius: 999,
            background: "rgba(10,14,20,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(143,184,214,0.3)",
          }}>
            <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="32" cy="32" r={RING_R} stroke="rgba(255,255,255,0.18)" strokeWidth="3" fill="none" />
                <circle
                  cx="32" cy="32" r={RING_R}
                  stroke="var(--sky)" strokeWidth="3" fill="none"
                  strokeDasharray={RING_C}
                  strokeDashoffset={ringDashoffset}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(143,184,214,0.7))", transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 18, color: "var(--bone)", lineHeight: 1 }}>
                {fmtTime(secondsLeft)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>{playing ? "HOLD" : "READY"}</div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>SET {setIndex}/{SETS_TOTAL}</div>
            </div>
          </div>

          {/* Bottom-left: move label inside the video */}
          <div style={{
            position: "absolute", left: 14, bottom: 14, right: 14,
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, pointerEvents: "none",
          }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.3em" }}>MOVE {CURRENT_MOVE.toString().padStart(2,"0")} / {TOTAL_MOVES}</div>
              <div className="e-display" style={{ fontSize: "clamp(20px, 4vw, 28px)", lineHeight: 0.95, marginTop: 4 }}>SINGLE-LEG BRIDGE</div>
            </div>
            {/* Set dots */}
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: SETS_TOTAL }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i < setIndex ? "var(--sky)" : "rgba(242,238,232,0.25)",
                  boxShadow: i + 1 === setIndex && playing ? "0 0 8px rgba(143,184,214,0.8)" : "none",
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* CUE COPY (below video) */}
        <p style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 14, textAlign: "center", maxWidth: 360, marginLeft: "auto", marginRight: "auto", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
          Press through the heel. Lift the hip. Hold the squeeze for three.
        </p>
      </div>

      {/* STATS + PROGRESS + CONTROLS */}
      <div style={{ flexShrink: 0, padding: "16px 22px 28px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Stat v={`${reps}/${REPS_TARGET}`} l="REPS" />
          <Stat v={`${bpm}`} l="BPM" />
          <Stat v={fmtTime(elapsed)} l="ELAPSED" />
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${overallPct * 100}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 10px rgba(143,184,214,0.6)", transition: "width .6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }} className="e-mono">
            <span style={{ color: "rgba(242,238,232,0.5)" }}>SET {setIndex} / {SETS_TOTAL}</span>
            <span style={{ color: "rgba(242,238,232,0.5)" }}>{secondsLeft}s HOLD</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={ctrlSm}>
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" strokeLinecap="round" /></svg>
            )}
          </button>
          <button aria-label="Previous move" style={ctrlMd}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={20} /></span>
          </button>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            style={{
              width: 76, height: 76, borderRadius: 999,
              background: "var(--sky)", color: "var(--ink)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 6px rgba(143,184,214,0.18), 0 0 30px rgba(77,169,214,0.4)",
              animation: playing ? "none" : "pulseSky 2s ease-in-out infinite",
            }}
          >
            {playing ? <Icon name="pause" size={26} /> : <Icon name="play" size={28} />}
          </button>
          <button aria-label="Next move" style={ctrlMd}>
            <Icon name="chevron" size={20} />
          </button>
          <button aria-label="Hydrate" style={ctrlSm}>
            <Icon name="bottle" size={18} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseSky {
          0%, 100% { box-shadow: 0 0 0 6px rgba(143,184,214,0.18), 0 0 30px rgba(77,169,214,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(143,184,214,0.06), 0 0 50px rgba(77,169,214,0.6); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ flex: 1, padding: "12px 14px", background: "rgba(143,184,214,0.06)", borderRadius: 12, border: "1px solid rgba(143,184,214,0.18)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", lineHeight: 1 }}>{v}</div>
      <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 4, letterSpacing: "0.2em" }}>{l}</div>
    </div>
  );
}

const ctrlChrome: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 999,
  background: "rgba(143,184,214,0.06)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid rgba(143,184,214,0.25)",
};
const ctrlSm: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 999,
  background: "rgba(143,184,214,0.08)",
  border: "1px solid rgba(143,184,214,0.22)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const ctrlMd: React.CSSProperties = {
  width: 56, height: 56, borderRadius: 999,
  background: "rgba(143,184,214,0.1)",
  border: "1px solid rgba(143,184,214,0.25)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
