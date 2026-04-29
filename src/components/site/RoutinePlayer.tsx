"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Routine } from "@/lib/data/routines";
import { markRoutineSessionCompleteAction } from "@/lib/program-actions";

type Phase = "ready" | "working" | "rest" | "done";
type LoadState = "idle" | "loading" | "ready" | "error";

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export type RoutinePlayerProgramContext = {
  programSessionId: string;
  programSlug: string;
};

export function RoutinePlayer({ routine, programContext }: { routine: Routine; programContext?: RoutinePlayerProgramContext }) {
  const totalSets = useMemo(() => routine.exercises.reduce((n, e) => n + e.sets, 0), [routine]);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0); // 0-based; setIdx === sets means done with this exercise
  const [phase, setPhase] = useState<Phase>("ready");
  const [restRemaining, setRestRemaining] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [playing, setPlaying] = useState(false);
  const [completionFired, setCompletionFired] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // When the routine reaches "done" while running inside a program, fire the
  // server action exactly once to write a program_completions row.
  useEffect(() => {
    if (phase !== "done") return;
    if (!programContext) return;
    if (completionFired) return;
    setCompletionFired(true);
    const fd = new FormData();
    fd.set("program_session_id", programContext.programSessionId);
    fd.set("program_slug", programContext.programSlug);
    fd.set("duration_actual_min", String(routine.duration_min));
    // Server action ignores its return value — fire and forget.
    markRoutineSessionCompleteAction(fd).catch(() => {
      // Swallow errors; user-facing UI already shows DONE.
    });
  }, [phase, programContext, completionFired, routine.duration_min]);

  const current = routine.exercises[exerciseIdx];
  const isLastExercise = exerciseIdx >= routine.exercises.length - 1;
  const completedSets = useMemo(() =>
    routine.exercises.slice(0, exerciseIdx).reduce((n, e) => n + e.sets, 0) + setIdx,
    [routine, exerciseIdx, setIdx],
  );
  const overallPct = Math.round((completedSets / Math.max(1, totalSets)) * 100);

  // Whenever the active exercise changes, swap the video source and PAUSE.
  // We no longer autoplay on load — the video is now strictly tied to the
  // working-set phase: it runs while the user is actively repping, stops the
  // moment they tap COMPLETE SET, and stays paused through rest. This makes
  // the demo loop a deliberate part of each set rather than an ambient layer.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !current) return;
    setLoadState("loading");
    v.src = current.video_url;
    v.load();
    v.muted = false; // we want the cue audio synced to the working set
    v.currentTime = 0;
    v.pause();
    setPlaying(false);
  }, [current]);

  // Rest countdown.
  useEffect(() => {
    if (phase !== "rest") return;
    const id = setInterval(() => {
      setRestRemaining(r => {
        if (r <= 1) {
          clearInterval(id);
          // Rest finished — advance to the next set OR next exercise.
          advanceAfterRest();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function advanceAfterRest() {
    setPhase("ready");
    // setIdx already incremented when rest started. Check if we need to move on.
    // Handled in completeSet().
  }

  // Helpers — keep video state in lockstep with the set phase.
  function playFromStart() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function pauseVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
  }

  function startSet() {
    setPhase("working");
    playFromStart();
  }

  function completeSet() {
    if (!current) return;
    pauseVideo();
    const nextSetIdx = setIdx + 1;
    if (nextSetIdx < current.sets) {
      // Still more sets of this exercise — go to rest.
      setSetIdx(nextSetIdx);
      setPhase("rest");
      setRestRemaining(current.rest_seconds);
      return;
    }
    // Finished the last set — advance to next exercise (or done).
    if (isLastExercise) {
      setPhase("done");
      return;
    }
    setExerciseIdx(i => i + 1);
    setSetIdx(0);
    setPhase("rest");
    setRestRemaining(current.rest_seconds);
  }

  function skipRest() {
    setPhase("ready");
    setRestRemaining(0);
    pauseVideo();
  }

  function previousExercise() {
    if (exerciseIdx === 0) return;
    setExerciseIdx(i => i - 1);
    setSetIdx(0);
    setPhase("ready");
    pauseVideo();
  }

  function nextExercise() {
    if (isLastExercise) return;
    setExerciseIdx(i => i + 1);
    setSetIdx(0);
    setPhase("ready");
    pauseVideo();
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }

  if (!current) return null;

  return (
    <div className="app app-dark" style={{ minHeight: "100dvh", background: "var(--ink)", color: "var(--bone)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0, padding: "20px 22px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/train" aria-label="Back" style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(143,184,214,0.06)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.25)", textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={16} /></span>
        </Link>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>STUDIO · {routine.trainer_name}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1, marginTop: 4, letterSpacing: "0.02em" }}>{routine.name}</div>
        </div>
        <div style={{ width: 42 }} aria-hidden />
      </div>

      {/* Overall routine progress */}
      <div style={{ flexShrink: 0, padding: "0 22px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>
            EXERCISE {exerciseIdx + 1} / {routine.exercises.length} · SET {setIdx + (phase === "done" ? 0 : 1)} / {current.sets}
          </span>
          <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{overallPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(143,184,214,0.18)", overflow: "hidden" }}>
          <div style={{ width: `${overallPct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 6px rgba(143,184,214,0.55)", transition: "width .35s ease" }} />
        </div>
      </div>

      {/* Video stage — explicit 16:9 ratio so the video scales cleanly on
          every viewport and the playlist below it stays scroll-friendly.
          minHeight ensures the stage doesn't collapse on tall narrow screens. */}
      <div style={{ flexShrink: 0, padding: "4px 22px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", background: "#000", width: "100%", aspectRatio: "16 / 9", minHeight: 220, maxHeight: "60vh" }}>
          <video
            ref={videoRef}
            playsInline
            muted
            preload="metadata"
            crossOrigin="anonymous"
            poster={current.poster_url}
            onLoadStart={() => setLoadState("loading")}
            onCanPlay={() => setLoadState((s) => (s === "error" ? "ready" : s))}
            onLoadedData={() => setLoadState("ready")}
            onError={() => setLoadState("error")}
            onClick={togglePlay}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
          />

          {/* Top-right: phase pill */}
          <div style={{ position: "absolute", top: 14, right: 14, padding: "8px 14px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: phase === "working" ? "var(--electric)" : phase === "rest" ? "var(--rose)" : "var(--sky)" }} />
            <span className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "var(--sky)" }}>
              {phase === "ready" && "READY"}
              {phase === "working" && "WORK"}
              {phase === "rest" && `REST · ${fmtTime(restRemaining)}`}
              {phase === "done" && "✓ DONE"}
            </span>
          </div>

          {/* Bottom: exercise label + cue */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "20px 18px", background: "linear-gradient(180deg, transparent 0%, rgba(10,14,20,0.95) 70%)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>
              MOVE {(exerciseIdx + 1).toString().padStart(2, "0")} / {routine.exercises.length}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 0.95, marginTop: 6, letterSpacing: "0.02em" }}>
              {current.name}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(242,238,232,0.78)", marginTop: 10, fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
              {current.cue}
            </div>
          </div>

          {loadState === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,14,20,0.4)", backdropFilter: "blur(2px)", pointerEvents: "none" }}>
              <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.25em" }}>LOADING…</span>
            </div>
          )}
        </div>
      </div>

      {/* Set/rep target chips */}
      <div style={{ flexShrink: 0, padding: "16px 22px 6px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <Stat label="SETS" value={`${setIdx}/${current.sets}`} />
        <Stat label={current.reps ? "REPS" : "HOLD"} value={current.reps ? String(current.reps) : `${current.hold_seconds ?? 0}S`} />
        <Stat label="REST" value={`${current.rest_seconds}S`} />
      </div>

      {/* Transport */}
      <div style={{ flexShrink: 0, padding: "8px 22px 22px" }}>
        {/* Primary action — phase-driven */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={previousExercise} disabled={exerciseIdx === 0} style={ctrlChrome(exerciseIdx === 0)} aria-label="Previous exercise">
            <Icon name="chevron" size={16} />
          </button>

          {phase === "ready" && (
            <button onClick={startSet} className="btn btn-sky" style={{ flex: 1, padding: "16px 22px", fontSize: 12 }}>
              ▶ START SET {setIdx + 1}
            </button>
          )}
          {phase === "working" && (
            <button onClick={completeSet} className="btn btn-sky" style={{ flex: 1, padding: "16px 22px", fontSize: 12 }}>
              ✓ COMPLETE SET {setIdx + 1}
            </button>
          )}
          {phase === "rest" && (
            <button onClick={skipRest} className="btn" style={{ flex: 1, padding: "16px 22px", fontSize: 12, background: "rgba(143,184,214,0.16)", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.4)" }}>
              SKIP REST · {fmtTime(restRemaining)}
            </button>
          )}
          {phase === "done" && (
            <Link
              href={programContext ? `/programs/${programContext.programSlug}` : "/train"}
              className="btn btn-sky"
              style={{ flex: 1, padding: "16px 22px", fontSize: 12, textAlign: "center" }}
            >
              {programContext ? "✓ COMPLETE → BACK TO PROGRAM" : "ROUTINE COMPLETE → TRAIN"}
            </Link>
          )}

          <button onClick={nextExercise} disabled={isLastExercise} style={ctrlChrome(isLastExercise)} aria-label="Next exercise">
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={16} /></span>
          </button>
        </div>

        {/* Secondary controls */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={togglePlay} style={miniCtrl} aria-label={playing ? "Pause" : "Play"}>
            <Icon name={playing ? "pause" : "play"} size={14} />
          </button>
          <button onClick={toggleMute} style={miniCtrl} aria-label="Mute / unmute">
            <Icon name="bell" size={14} />
          </button>
        </div>

        {/* Routine playlist — every move in the queue. The current move
            highlights, completed moves dim, and tapping a future move jumps
            you to it (handy if you want to preview or skip). */}
        <div style={{ marginTop: 14 }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.25em", marginBottom: 8, padding: "0 4px", display: "flex", justifyContent: "space-between" }}>
            <span>PLAYLIST · {routine.exercises.length} MOVES</span>
            <span style={{ color: "var(--sky)" }}>{exerciseIdx + 1} / {routine.exercises.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
            {routine.exercises.map((ex, i) => {
              const isPast = i < exerciseIdx;
              const isCurrent = i === exerciseIdx;
              const repLabel = ex.reps !== null ? `${ex.sets} × ${ex.reps}` : `${ex.sets} × ${ex.hold_seconds ?? 0}S HOLD`;
              return (
                <button
                  key={ex.slug}
                  type="button"
                  onClick={() => {
                    if (i === exerciseIdx) return;
                    setExerciseIdx(i);
                    setSetIdx(0);
                    setPhase("ready");
                    pauseVideo();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    textAlign: "left",
                    cursor: isCurrent ? "default" : "pointer",
                    background: isCurrent
                      ? "linear-gradient(135deg, rgba(143,184,214,0.22), rgba(46,127,176,0.06))"
                      : "rgba(143,184,214,0.04)",
                    border: isCurrent
                      ? "1px solid var(--sky)"
                      : "1px solid rgba(143,184,214,0.14)",
                    color: "var(--bone)",
                    opacity: isPast && !isCurrent ? 0.45 : 1,
                    transition: "background .15s ease, border-color .15s ease",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 26, height: 26, borderRadius: "50%",
                      background: isCurrent ? "var(--sky)" : isPast ? "rgba(143,184,214,0.18)" : "rgba(143,184,214,0.08)",
                      color: isCurrent ? "var(--ink)" : "var(--sky)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                    }}
                    aria-hidden
                  >
                    {isPast ? "✓" : (i + 1).toString().padStart(2, "0")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.05, letterSpacing: "0.02em" }}>
                      {ex.name}
                    </div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 3, letterSpacing: "0.18em" }}>
                      {repLabel} · {ex.rest_seconds}S REST
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em", flexShrink: 0 }}>
                      ▶ NOW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const ctrlChrome = (disabled: boolean): React.CSSProperties => ({
  width: 44, height: 48, borderRadius: 12,
  background: "rgba(143,184,214,0.06)",
  color: "var(--bone)",
  border: "1px solid rgba(143,184,214,0.25)",
  display: "flex", alignItems: "center", justifyContent: "center",
  opacity: disabled ? 0.35 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
});

const miniCtrl: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  background: "rgba(143,184,214,0.06)",
  color: "rgba(242,238,232,0.7)",
  border: "1px solid rgba(143,184,214,0.18)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(143,184,214,0.06)", border: "1px solid rgba(143,184,214,0.2)", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", lineHeight: 1 }}>{value}</div>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 5, letterSpacing: "0.22em" }}>{label}</div>
    </div>
  );
}
