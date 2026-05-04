"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import DailyIframe, { type DailyCall, type DailyParticipant, type DailyEventObjectFatalError, type DailyEventObjectNonFatalError } from "@daily-co/daily-js";
import type { Routine } from "@/lib/data/routines";
import type { RoutineLiveControl } from "@/components/site/RoutinePlayer";
import { updateRoutineStateAction, clearRoutineStateAction } from "@/lib/routine-state-actions";
import { createClient } from "@/lib/supabase/client";

type Phase = "ready" | "working" | "rest" | "done";

/**
 * Live session stage — fullscreen, custom layout.
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ [LEAVE]                  [LIVE · COACH]     │
 *   │                                             │
 *   │ ┌──────────┐                                │
 *   │ │ caller   │  ← top-left, 16:9              │
 *   │ │ (other)  │     under the LEAVE chip       │
 *   │ └──────────┘                                │
 *   │                                             │
 *   │            EXERCISE 1 / 6 · STEP-UPS        │
 *   │                                             │
 *   │                       ┌─────────────────┐   │
 *   │                       │ workout 16:9    │   │
 *   │                       │  ▶ ❚❚ ⏭ ⏹      │   │ ← coach only
 *   │                       └─────────────────┘   │
 *   │                                             │
 *   └─────────────────────────────────────────────┘
 *
 * Two media surfaces, no swap (positions are fixed). Daily call rendered
 * via callObject mode — only the remote face is shown (no self-view, no
 * Daily chrome). Workout video streams the current exercise from the
 * routine and syncs across participants via trainer_sessions.routine_state:
 * the coach's play/pause/skip writes the row, members subscribe and mirror.
 */
export function LiveSessionStage({
  dailyUrl,
  videoProvider,
  routine,
  live,
  backHref,
  trainerName,
  isCoach,
}: {
  dailyUrl: string | null;
  videoProvider: string | null;
  routine?: Routine | null;
  live?: RoutineLiveControl;
  backHref: string;
  trainerName: string;
  isCoach: boolean;
}) {
  const isMock = !dailyUrl || dailyUrl.startsWith("mock://") || videoProvider === "mock";

  /* ------------------------------------------------------------------ */
  /*  Daily call                                                        */
  /* ------------------------------------------------------------------ */
  const callRef = useRef<DailyCall | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [hasRemote, setHasRemote] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [callJoinState, setCallJoinState] = useState<"idle" | "joining" | "joined" | "error">("idle");
  const [callError, setCallError] = useState<string | null>(null);
  // Self-view card minimize state — when minimized, the card collapses to a
  // tiny chip in the corner so the remote (background) takes the whole
  // screen plus just the workout card. Tap the chip to expand.
  const [selfMinimized, setSelfMinimized] = useState(false);

  useEffect(() => {
    if (isMock) return;
    if (!dailyUrl) return;
    if (callRef.current) return;
    let cleaned = false;

    let call: DailyCall;
    try {
      call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
        subscribeToTracksAutomatically: true,
        dailyConfig: { useDevicePreferenceCookies: true },
      });
    } catch (err) {
      setCallJoinState("error");
      setCallError((err as Error).message);
      return;
    }
    callRef.current = call;

    function refresh() {
      if (cleaned || !callRef.current) return;
      const ps = callRef.current.participants();
      const local = ps.local;
      const remoteIds = Object.keys(ps).filter(k => k !== "local");
      const remote: DailyParticipant | undefined = remoteIds.length > 0 ? ps[remoteIds[0]] : undefined;
      setHasRemote(!!remote);
      attachVideo(remoteVideoRef.current, remote);
      attachVideo(localVideoRef.current, local);
      attachAudio(remoteAudioRef.current, remote);
    }

    call.on("joined-meeting", () => { setCallJoinState("joined"); refresh(); });
    call.on("participant-joined", refresh);
    call.on("participant-updated", refresh);
    call.on("participant-left", refresh);
    call.on("track-started", refresh);
    call.on("track-stopped", refresh);
    call.on("error", (e: DailyEventObjectFatalError | DailyEventObjectNonFatalError) => {
      const msg = "errorMsg" in e ? e.errorMsg : "Call error";
      // eslint-disable-next-line no-console
      console.warn("[live-stage] daily error:", e);
      setCallJoinState("error");
      setCallError(msg || "Call error");
    });

    setCallJoinState("joining");
    call.join({ url: dailyUrl }).catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.warn("[live-stage] daily join failed:", err);
      setCallJoinState("error");
      setCallError(err?.message || "Couldn't join the call.");
    });

    return () => {
      cleaned = true;
      const c = callRef.current;
      callRef.current = null;
      if (c) {
        c.leave().catch(() => {});
        c.destroy().catch(() => {});
      }
    };
  }, [dailyUrl, isMock]);

  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    callRef.current?.setLocalAudio(next);
    setAudioOn(next);
  }, [audioOn]);

  const toggleVideo = useCallback(() => {
    const next = !videoOn;
    callRef.current?.setLocalVideo(next);
    setVideoOn(next);
  }, [videoOn]);

  /* ------------------------------------------------------------------ */
  /*  Routine playback (coach pushes, member mirrors)                   */
  /* ------------------------------------------------------------------ */
  const routineVideoRef = useRef<HTMLVideoElement | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const current = routine?.exercises[exerciseIdx];
  const playing = phase === "working";

  // Push routine state when coach changes anything. We push the simplified
  // {exerciseIdx, phase} shape (the existing routine_state schema), with
  // setIdx pinned to 0 so the existing RoutinePlayer-side consumers keep
  // working on the regular meta page.
  const coachSessionId = live?.mode === "coach" ? live.sessionId : null;
  const lastPushedRef = useRef<string>("");
  useEffect(() => {
    if (!coachSessionId) return;
    const key = `${exerciseIdx}|${phase}`;
    if (lastPushedRef.current === key) return;
    lastPushedRef.current = key;
    const fd = new FormData();
    fd.set("session_id", coachSessionId);
    fd.set("exercise_idx", String(exerciseIdx));
    fd.set("set_idx", "0");
    fd.set("phase", phase);
    fd.set("phase_started_at", new Date().toISOString());
    updateRoutineStateAction(fd).catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.warn("[live-stage] routine push failed:", err.message);
    });
  }, [coachSessionId, exerciseIdx, phase]);

  // Subscribe to the parent session row in member mode and mirror state.
  // Also hydrate from the current row on mount — without this, a member
  // who joins after the coach has already advanced to exercise 3 starts at
  // 0 and only ever sees the *next* change, never the current state.
  // Dep is the stable session id (not the live object reference) so
  // identity churn from the parent doesn't constantly re-subscribe.
  const sessionId = live?.mode === "follow" ? live.sessionId : null;
  useEffect(() => {
    if (!sessionId) return;
    const sb = createClient();
    let cancelled = false;

    // Initial hydrate
    sb.from("trainer_sessions")
      .select("routine_state")
      .eq("id", sessionId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const s = (data as { routine_state: { exerciseIdx: number; phase: Phase } | null } | null)?.routine_state;
        if (!s) return;
        setExerciseIdx(s.exerciseIdx ?? 0);
        setPhase(s.phase ?? "ready");
      });

    const channel = sb
      .channel(`stage-routine-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trainer_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as { routine_state: { exerciseIdx: number; phase: Phase } | null };
          const s = row.routine_state;
          if (!s) return;
          setExerciseIdx(s.exerciseIdx ?? 0);
          setPhase(s.phase ?? "ready");
        },
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        console.log(`[live-stage] follower subscription:`, status);
      });
    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [sessionId]);

  // Sync the <video> element to the playing state + current exercise URL.
  useEffect(() => {
    const v = routineVideoRef.current;
    if (!v || !current) return;
    if (v.src !== current.video_url) {
      v.src = current.video_url;
      v.load();
      v.currentTime = 0;
    }
  }, [current]);

  useEffect(() => {
    const v = routineVideoRef.current;
    if (!v) return;
    if (playing) {
      v.play().catch(() => { /* iOS may need a user gesture; coach taps PLAY */ });
    } else {
      v.pause();
    }
  }, [playing]);

  /* ------------------------------------------------------------------ */
  /*  Coach controls                                                    */
  /* ------------------------------------------------------------------ */
  const onPlay = useCallback(() => setPhase("working"), []);
  const onPause = useCallback(() => setPhase("ready"), []);
  const onSkip = useCallback(() => {
    if (!routine) return;
    setExerciseIdx(i => Math.min(routine.exercises.length - 1, i + 1));
    setPhase("ready");
  }, [routine]);
  const onPrev = useCallback(() => {
    setExerciseIdx(i => Math.max(0, i - 1));
    setPhase("ready");
  }, []);
  const onStop = useCallback(() => {
    setPhase("done");
    if (coachSessionId) {
      const fd = new FormData();
      fd.set("session_id", coachSessionId);
      clearRoutineStateAction(fd).catch(() => {});
    }
  }, [coachSessionId]);

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  if (isMock) {
    return (
      <div style={shellStyle}>
        <Header backHref={backHref} trainerName={trainerName} />
        <div style={overlayStyle}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>📹 MOCK VIDEO ROOM</div>
          <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1 }}>DAILY ROOM PENDING.</div>
          <p style={{ marginTop: 12, fontSize: 13, color: "rgba(242,238,232,0.6)", maxWidth: 480, lineHeight: 1.6 }}>
            Set <code style={{ color: "var(--sky)" }}>DAILY_API_KEY</code> on the server to swap this for a live call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      {/* Audio sink — keeps remote audio playing across DOM reflows */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Background — full-screen view of the remote person (the one you
          called). Sits at z-index 0 so the workout card, self-view chip,
          header, and controls all layer above it. */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          background: "#000",
          zIndex: 0,
        }}
      />

      {/* Empty / error states for the call land in the center of the
          background instead of sitting in the small card. */}
      {(!hasRemote || callJoinState === "error") && (
        <div style={backgroundOverlayStyle}>
          {callJoinState === "error" && callError ? (
            <>
              <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.25em" }}>CALL ERROR</div>
              <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.85)", maxWidth: 460, lineHeight: 1.55, textAlign: "center" }}>{callError}</p>
            </>
          ) : (
            <>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
                {callJoinState === "joining" ? "JOINING…" : `WAITING FOR ${isCoach ? "MEMBER" : trainerName.toUpperCase()}`}
              </div>
              {callJoinState === "joined" && (
                <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.22em" }}>
                  THEY&apos;LL DROP IN ANY SECOND
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Header */}
      <Header backHref={backHref} trainerName={trainerName} />

      {/* Self-view card — top-left, under the LEAVE chip. Mirrored, with a
          minimize button so the call surface can collapse to just the
          background + workout when the user wants. */}
      {!selfMinimized ? (
        <div style={callerCardStyle}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              background: "#000", display: "block",
              transform: "scaleX(-1)",  // self-view mirrored, FaceTime-style
            }}
          />
          {!videoOn && (
            <div style={cardOverlayStyle}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.22em" }}>
                CAMERA OFF
              </div>
            </div>
          )}
          <div style={cardLabelStyle}>YOU</div>
          <button
            type="button"
            aria-label="Minimize self-view"
            onClick={() => setSelfMinimized(true)}
            style={selfMinimizeBtnStyle}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      ) : (
        // Minimized: tiny chip in the top-left, tap to expand.
        <button
          type="button"
          aria-label="Show self-view"
          onClick={() => setSelfMinimized(false)}
          style={selfChipStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <span className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em" }}>YOU</span>
        </button>
      )}

      {/* Status — center top, what's playing. When the self-view is
          minimized the strip slides left to fill the freed space. */}
      {routine && current && (
        <div style={selfMinimized ? statusStripExpandedStyle : statusStripStyle}>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.28em" }}>
            EXERCISE {exerciseIdx + 1} / {routine.exercises.length}
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--font-display)", fontSize: "clamp(20px, 3.5vw, 30px)", lineHeight: 1, letterSpacing: "0.02em" }}>
            {current.name.toUpperCase()}
          </div>
          {current.cue && (
            <div style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.78)", fontStyle: "italic", fontFamily: "var(--font-serif)", maxWidth: 520 }}>
              {current.cue}
            </div>
          )}
        </div>
      )}

      {/* Workout card — bottom-right, 16:9 */}
      {routine && (
        <div style={workoutCardStyle}>
          <video
            ref={routineVideoRef}
            playsInline
            // Muted so iOS Safari allows autoplay when the coach hits PLAY
            // and pushes phase=working — without this, the member's video
            // silently stays paused. Voice cues come from the Daily call,
            // so the demo's own audio isn't needed.
            muted
            preload="auto"
            crossOrigin="anonymous"
            poster={current?.poster_url}
            style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000", display: "block" }}
          />
          {/* Phase pill */}
          <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(10,14,20,0.7)", border: "1px solid rgba(143,184,214,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: phase === "working" ? "var(--electric)" : phase === "done" ? "var(--rose)" : "var(--sky)" }} />
            <span className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "var(--sky)" }}>
              {phase === "working" && "PLAYING"}
              {phase === "ready" && "PAUSED"}
              {phase === "rest" && "REST"}
              {phase === "done" && "✓ DONE"}
            </span>
          </div>

          {/* Coach controls overlay */}
          {isCoach && (
            <div style={controlsOverlayStyle}>
              <CoachBtn aria-label="Previous exercise" onClick={onPrev} disabled={exerciseIdx === 0}><PrevIcon /></CoachBtn>
              {playing ? (
                <CoachBtn aria-label="Pause" onClick={onPause} primary><PauseIcon /></CoachBtn>
              ) : (
                <CoachBtn aria-label="Play" onClick={onPlay} primary><PlayIcon /></CoachBtn>
              )}
              <CoachBtn aria-label="Skip exercise" onClick={onSkip} disabled={exerciseIdx >= (routine.exercises.length - 1)}><SkipIcon /></CoachBtn>
              <CoachBtn aria-label="Stop" onClick={onStop} danger><StopIcon /></CoachBtn>
            </div>
          )}
        </div>
      )}

      {/* Bottom mic / cam toggle for both sides — small, unobtrusive */}
      <div style={callControlsStyle}>
        <ControlPill off={!audioOn} onClick={toggleAudio} aria-label={audioOn ? "Mute" : "Unmute"}>
          <MicIcon muted={!audioOn} />
        </ControlPill>
        <ControlPill off={!videoOn} onClick={toggleVideo} aria-label={videoOn ? "Stop camera" : "Start camera"}>
          <CamIcon off={!videoOn} />
        </ControlPill>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/*  Helpers / leaf components                                           */
/* -------------------------------------------------------------------- */

function Header({ backHref, trainerName }: { backHref: string; trainerName: string }) {
  return (
    <header style={headerStyle}>
      <Link href={backHref} aria-label="Leave session" style={chipStyle}>
        ← LEAVE
      </Link>
      <span style={{ ...chipStyle, color: "var(--sky)" }}>
        ◉ LIVE · {trainerName.toUpperCase()}
      </span>
    </header>
  );
}

function attachVideo(el: HTMLVideoElement | null, p?: DailyParticipant) {
  if (!el) return;
  const stream = new MediaStream();
  const track = p?.tracks?.video?.persistentTrack;
  if (track) stream.addTrack(track);
  if (el.srcObject !== stream) {
    el.srcObject = stream;
    el.play().catch(() => {});
  }
}

function attachAudio(el: HTMLAudioElement | null, p?: DailyParticipant) {
  if (!el) return;
  const stream = new MediaStream();
  const track = p?.tracks?.audio?.persistentTrack;
  if (track) stream.addTrack(track);
  if (el.srcObject !== stream) {
    el.srcObject = stream;
    el.play().catch(() => {});
  }
}

function CoachBtn({ children, onClick, disabled, primary, danger, "aria-label": ariaLabel }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  "aria-label": string;
}) {
  const bg = danger ? "var(--rose)" : primary ? "var(--sky)" : "rgba(10,14,20,0.7)";
  const color = danger || primary ? "var(--ink)" : "var(--bone)";
  const border = danger
    ? "1px solid rgba(232,181,168,0.7)"
    : primary
    ? "1px solid rgba(143,184,214,0.7)"
    : "1px solid rgba(143,184,214,0.35)";
  const size = primary ? 44 : 36;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color, border,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        backdropFilter: primary || danger ? undefined : "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

function ControlPill({ children, onClick, off, "aria-label": ariaLabel }: {
  children: React.ReactNode;
  onClick: () => void;
  off: boolean;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: "50%",
        background: off ? "rgba(232,181,168,0.16)" : "rgba(143,184,214,0.14)",
        border: `1px solid ${off ? "rgba(232,181,168,0.5)" : "rgba(143,184,214,0.45)"}`,
        color: off ? "var(--rose)" : "var(--bone)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
}
function PauseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>;
}
function SkipIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zm12 0h2v16h-2V4z" /></svg>;
}
function PrevIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ transform: "scaleX(-1)" }}><path d="M5 4l10 8-10 8V4zm12 0h2v16h-2V4z" /></svg>;
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>;
}
function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10a7 7 0 0 1-14 0" />
      <line x1="12" y1="17" x2="12" y2="22" />
      {muted && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}
function CamIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

/* -------------------------------------------------------------------- */
/*  Style constants                                                     */
/* -------------------------------------------------------------------- */

const shellStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "var(--ink)",
  color: "var(--bone)",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  position: "absolute",
  top: 0, left: 0, right: 0,
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
  paddingLeft: 18,
  paddingRight: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 6,
  pointerEvents: "none",
};

const chipStyle: React.CSSProperties = {
  pointerEvents: "auto",
  padding: "8px 14px",
  borderRadius: 999,
  background: "rgba(10,14,20,0.55)",
  backdropFilter: "blur(10px)",
  color: "var(--bone)",
  textDecoration: "none",
  border: "1px solid rgba(143,184,214,0.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.24em",
};

// Self-view card — top-left under the LEAVE chip, mirrored, with a
// minimize button. The background of the stage is the *remote* person.
const callerCardStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(env(safe-area-inset-top, 0px) + 70px)",
  left: 16,
  width: "min(36vw, 220px)",
  aspectRatio: "16 / 9",
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid rgba(143,184,214,0.4)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
  background: "#000",
  zIndex: 5,
};

// Tiny floating chip when the self-view is minimized — taps to expand.
const selfChipStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(env(safe-area-inset-top, 0px) + 70px)",
  left: 16,
  zIndex: 5,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(10,14,20,0.7)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(143,184,214,0.35)",
  color: "var(--sky)",
  cursor: "pointer",
};

// Minimize button overlaid on the self-view card.
const selfMinimizeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 22, height: 22, borderRadius: "50%",
  background: "rgba(10,14,20,0.65)",
  color: "var(--bone)",
  border: "1px solid rgba(143,184,214,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

// Center overlay for joining / waiting / error states on the background.
const backgroundOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(10,14,20,0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 22,
  zIndex: 1,
};

const cardOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(10,14,20,0.7)",
  textAlign: "center",
  padding: 8,
};

const cardLabelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 6, left: 6,
  padding: "3px 7px",
  borderRadius: 5,
  background: "rgba(10,14,20,0.7)",
  color: "var(--sky)",
  fontFamily: "var(--font-mono)",
  fontSize: 8,
  letterSpacing: "0.22em",
};

// Workout video — bottom-right, 16:9 — sits above the background remote
// video so the demo is always visible while the call streams behind.
const workoutCardStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)",
  right: 16,
  width: "min(58vw, 380px)",
  aspectRatio: "16 / 9",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(143,184,214,0.4)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
  background: "#000",
  zIndex: 5,
};


const controlsOverlayStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 10, left: 0, right: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: 4,
  zIndex: 2,
};

// Status strip — exercise name + cue. Sits next to the self-view card by
// default; slides left when the self-view is minimized so the title can
// breathe. Pulled into its own background pill so text stays legible
// against the live remote video underneath.
const statusStripBase: React.CSSProperties = {
  position: "absolute",
  top: "calc(env(safe-area-inset-top, 0px) + 70px)",
  right: 16,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  zIndex: 5,
  padding: "10px 14px",
  borderRadius: 12,
  background: "rgba(10,14,20,0.55)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(143,184,214,0.18)",
  pointerEvents: "none",
};
const statusStripStyle: React.CSSProperties = {
  ...statusStripBase,
  left: "calc(min(36vw, 220px) + 32px)",
};
const statusStripExpandedStyle: React.CSSProperties = {
  ...statusStripBase,
  left: 80,
};

// Mic + cam pills — bottom-left, opposite the workout card.
const callControlsStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
  left: 16,
  display: "flex",
  gap: 10,
  zIndex: 6,
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 22,
  textAlign: "center",
};
