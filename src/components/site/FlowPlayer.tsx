"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const SUPABASE = "https://xiimrgdfbucpwugxmkrm.supabase.co";
const VIDEO_URL = `${SUPABASE}/storage/v1/object/public/media/flow.mp4`;
const POSTER_URL = `${SUPABASE}/storage/v1/object/public/media/flow-poster.jpg`;

const HOLD_SECONDS = 23;       // countdown per hold
const SETS_TOTAL = 3;          // 3 sets per move
const REPS_TARGET = 12;        // reps in active mode
const TOTAL_MOVES = 11;
const CURRENT_MOVE = 4;

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export function FlowPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [setIndex, setSetIndex] = useState(1);   // 1-based: 1, 2, 3
  const [reps, setReps] = useState(0);
  const [elapsed, setElapsed] = useState(14 * 60 + 32); // 14:32 starting feel
  const [bpm, setBpm] = useState(142);

  // Tick the countdown / rep counter while playing
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 0) {
          // hold complete → bump set / cycle
          setSetIndex((i) => {
            if (i >= SETS_TOTAL) return 1;
            return i + 1;
          });
          return HOLD_SECONDS;
        }
        return s - 1;
      });
      setElapsed((t) => t + 1);
      // Fake rep counter rises 1 every ~2s while active
      setReps((r) => (r >= REPS_TARGET ? 1 : r + (Math.random() > 0.45 ? 1 : 0)));
      // BPM drifts a touch
      setBpm((b) => Math.max(132, Math.min(168, b + Math.round((Math.random() - 0.5) * 4))));
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  function togglePlay() {
    const v = videoRef.current;
    setPlaying((p) => {
      const next = !p;
      if (v) {
        if (next) v.play().catch(() => {});
        else v.pause();
      }
      return next;
    });
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function reset() {
    setPlaying(false);
    setSecondsLeft(HOLD_SECONDS);
    setSetIndex(1);
    setReps(0);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }

  // ring math
  const RING_R = 110;
  const RING_C = 2 * Math.PI * RING_R;
  const ringPct = secondsLeft / HOLD_SECONDS;
  const ringDashoffset = RING_C * (1 - ringPct);

  // overall workout progress (rough): completed sets and elapsed
  const overallPct = Math.min(0.99, (setIndex - 1 + (1 - secondsLeft / HOLD_SECONDS)) / SETS_TOTAL);

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "#000", color: "var(--bone)", position: "relative", overflow: "hidden" }}>
      {/* Background video */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        poster={POSTER_URL}
        muted={muted}
        loop
        playsInline
        preload="auto"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.7) 0%, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.15) 60%, rgba(10,14,20,0.96) 100%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "20px 22px 32px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/train" aria-label="Back" style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.18)" }}>
            <Icon name="chevronDown" size={20} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(143,184,214,0.18)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: playing ? "var(--sky)" : "rgba(242,238,232,0.4)", animation: playing ? "pulse-ring 2s infinite" : "none" }} />
            <span className="e-tag">AI GUIDE · ZURI</span>
          </div>
          <button onClick={reset} aria-label="Reset" style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.18)", cursor: "pointer" }}>
            <Icon name="settings" size={18} />
          </button>
        </div>

        {/* Center: countdown ring */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 240, height: 240 }}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="120" cy="120" r={RING_R} stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
              <circle
                cx="120"
                cy="120"
                r={RING_R}
                stroke="var(--sky)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={RING_C}
                strokeDashoffset={ringDashoffset}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 14px rgba(143,184,214,0.65))", transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.3em" }}>{playing ? "HOLD" : "READY"}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 84, lineHeight: 1, color: "var(--bone)", textShadow: "0 0 24px rgba(143,184,214,0.45)" }}>
                {fmtTime(secondsLeft)}
              </div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, marginTop: 4, letterSpacing: "0.2em" }}>
                SET {setIndex.toString().padStart(2, "0")} / {SETS_TOTAL.toString().padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Set dots */}
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            {Array.from({ length: SETS_TOTAL }).map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: i + 1 < setIndex ? "var(--sky)" :
                            i + 1 === setIndex ? "var(--sky)" :
                            "rgba(255,255,255,0.18)",
                opacity: i + 1 === setIndex ? 1 : (i + 1 < setIndex ? 0.6 : 1),
                boxShadow: i + 1 === setIndex && playing ? "0 0 12px rgba(143,184,214,0.8)" : "none",
                transition: "all .3s ease",
              }} />
            ))}
          </div>
        </div>

        {/* Lower content */}
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6, textAlign: "center", letterSpacing: "0.3em" }}>
            MOVE {CURRENT_MOVE.toString().padStart(2, "0")} / {TOTAL_MOVES}
          </div>
          <div className="e-display" style={{ fontSize: "clamp(28px, 5.4vw, 38px)", lineHeight: 0.95, textAlign: "center" }}>
            SINGLE-LEG BRIDGE
          </div>
          <div style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 10, textAlign: "center", maxWidth: 320, marginLeft: "auto", marginRight: "auto", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            Press through the heel. Lift the hip. Hold the squeeze for three.
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Stat v={`${reps}/${REPS_TARGET}`} l="REPS" />
            <Stat v={`${bpm}`} l="BPM" />
            <Stat v={fmtTime(elapsed)} l="ELAPSED" />
          </div>

          {/* Workout progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${overallPct * 100}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 10px rgba(143,184,214,0.6)", transition: "width .9s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }} className="e-mono">
              <span style={{ color: "rgba(242,238,232,0.5)" }}>{fmtTime(elapsed)}</span>
              <span style={{ color: "rgba(242,238,232,0.5)" }}>SET {setIndex} · {fmtTime(secondsLeft)} HOLD</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={ctrlSm}>
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" /></svg>
              ) : <Icon name="mic" size={18} />}
            </button>
            <button aria-label="Previous move" style={ctrlMd}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={20} /></span>
            </button>

            {/* PRIMARY play/pause */}
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              style={{
                width: 84, height: 84, borderRadius: 999,
                background: "var(--sky)", color: "var(--ink)",
                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 0 0 8px rgba(143,184,214,0.18), 0 0 40px rgba(77,169,214,0.45)",
                animation: playing ? "none" : "pulseSky 2s ease-in-out infinite",
                transition: "transform .2s ease",
              }}
            >
              {playing ? <Icon name="pause" size={28} /> : <Icon name="play" size={30} />}
            </button>

            <button aria-label="Next move" style={ctrlMd}>
              <Icon name="chevron" size={20} />
            </button>
            <button aria-label="Hydrate" style={ctrlSm}>
              <Icon name="bottle" size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseSky {
          0%, 100% { box-shadow: 0 0 0 8px rgba(143,184,214,0.18), 0 0 40px rgba(77,169,214,0.45); }
          50%      { box-shadow: 0 0 0 14px rgba(143,184,214,0.08), 0 0 60px rgba(77,169,214,0.6); }
        }
      `}</style>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ flex: 1, padding: 12, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(12px)", borderRadius: 12, border: "1px solid rgba(143,184,214,0.18)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)" }}>{v}</div>
      <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 2, letterSpacing: "0.2em" }}>{l}</div>
    </div>
  );
}

const ctrlSm: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const ctrlMd: React.CSSProperties = {
  width: 56, height: 56, borderRadius: 999,
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "var(--bone)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
