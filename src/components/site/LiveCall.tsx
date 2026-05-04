"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import DailyIframe, { type DailyCall, type DailyParticipant, type DailyEventObjectFatalError, type DailyEventObjectNonFatalError } from "@daily-co/daily-js";

/**
 * Custom PIP video call surface.
 *
 * We use daily-js in callObject mode (not Prebuilt) so we render the video
 * tiles ourselves — no Daily chrome, no chat panel, no participant bar. Two
 * <video> elements always mounted (one per participant) and the CSS
 * `primary` / `pip` styles toggle which is full-bleed and which is the
 * tap-to-swap corner.
 *
 * Audio is split off into a hidden <audio> sink for the remote stream so
 * swapping the videos doesn't interrupt it. Self-view is muted at the
 * <video> level so the user never hears themselves.
 *
 * Designed for 1-on-1 — when more remote participants land we just keep
 * showing the first one in the primary spot. We can iterate to a tiled
 * grid later for full group calls.
 */
export function LiveCall({
  url,
  trainerName,
  isCoach,
  backHref,
}: {
  url: string;
  trainerName: string;
  isCoach: boolean;
  backHref: string;
}) {
  const callRef = useRef<DailyCall | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [hasRemote, setHasRemote] = useState(false);
  // "remote" = remote participant fills the screen, self in PIP corner
  // "local"  = self fills the screen, remote in PIP corner (or alone if solo)
  const [primary, setPrimary] = useState<"remote" | "local">("remote");
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [joinState, setJoinState] = useState<"idle" | "joining" | "joined" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      setJoinState("error");
      setError((err as Error).message);
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

      attachVideo(localVideoRef.current, local);
      attachVideo(remoteVideoRef.current, remote);
      attachAudio(remoteAudioRef.current, remote);
    }

    call.on("joined-meeting", () => { setJoinState("joined"); refresh(); });
    call.on("participant-joined", refresh);
    call.on("participant-updated", refresh);
    call.on("participant-left", refresh);
    call.on("track-started", refresh);
    call.on("track-stopped", refresh);
    call.on("error", (e: DailyEventObjectFatalError | DailyEventObjectNonFatalError) => {
      const msg = "errorMsg" in e ? e.errorMsg : "Call error";
      // eslint-disable-next-line no-console
      console.warn("[live-call] error:", e);
      setJoinState("error");
      setError(msg || "Call error");
    });
    call.on("camera-error", (e: { errorMsg?: { errorMsg?: string; msg?: string } }) => {
      // eslint-disable-next-line no-console
      console.warn("[live-call] camera error:", e);
      setError(e?.errorMsg?.errorMsg || e?.errorMsg?.msg || "Camera blocked. Allow access in your browser settings.");
    });

    setJoinState("joining");
    call.join({ url }).catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.warn("[live-call] join failed:", err);
      setJoinState("error");
      setError(err?.message || "Couldn't join the call.");
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
  }, [url]);

  const localIsPrimary = primary === "local" && hasRemote;
  // When there's no remote participant, our self-view goes primary by default.
  const showLocalPrimary = localIsPrimary || !hasRemote;

  const swap = useCallback(() => {
    if (!hasRemote) return;
    setPrimary(p => (p === "remote" ? "local" : "remote"));
  }, [hasRemote]);

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

  return (
    <div style={shellStyle}>
      {/* Audio sink — keeps remote audio playing across PIP swaps */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Remote video — primary by default, becomes PIP when local is primary. */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        onClick={localIsPrimary && hasRemote ? swap : undefined}
        style={{
          ...(localIsPrimary ? pipPositionStyle : primaryPositionStyle),
          // When there's no remote yet, hide the empty remote video.
          opacity: hasRemote ? 1 : 0,
          background: "#000",
          objectFit: "cover",
          cursor: localIsPrimary ? "pointer" : "default",
        }}
      />

      {/* Local video — PIP by default. Always mirrored for the natural
          self-view feel. */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        onClick={!showLocalPrimary && hasRemote ? swap : undefined}
        style={{
          ...(showLocalPrimary ? primaryPositionStyle : pipPositionStyle),
          background: "#000",
          objectFit: "cover",
          transform: "scaleX(-1)",
          cursor: !showLocalPrimary && hasRemote ? "pointer" : "default",
        }}
      />

      {/* PIP label sits on top of whichever tile is in the corner */}
      {hasRemote && (
        <PipLabel onCorner={localIsPrimary ? "remote" : "local"} text={
          localIsPrimary
            ? (isCoach ? "MEMBER" : trainerName.toUpperCase())
            : "YOU"
        } />
      )}

      {/* Joining / error / waiting states */}
      {joinState === "joining" && (
        <Overlay>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
            JOINING…
          </div>
        </Overlay>
      )}
      {joinState === "joined" && !hasRemote && (
        <Overlay>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
            WAITING FOR {isCoach ? "MEMBER" : trainerName.toUpperCase()}
          </div>
          <div className="e-mono" style={{ marginTop: 12, color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>
            THEY&apos;LL DROP IN ANY SECOND
          </div>
        </Overlay>
      )}
      {joinState === "error" && (
        <Overlay>
          <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.28em" }}>
            COULDN&apos;T START CALL
          </div>
          {error && (
            <div style={{ marginTop: 14, fontSize: 13, color: "rgba(242,238,232,0.85)", maxWidth: 480, textAlign: "center", lineHeight: 1.55 }}>
              {error}
            </div>
          )}
          <Link href={backHref} className="btn btn-sky" style={{ marginTop: 22, padding: "12px 22px" }}>
            BACK
          </Link>
        </Overlay>
      )}

      {/* Top header */}
      <header style={headerStyle}>
        <Link href={backHref} aria-label="Leave session" style={chipStyle}>
          ← LEAVE
        </Link>
        <span style={{ ...chipStyle, color: "var(--sky)" }}>
          ◉ LIVE · {trainerName.toUpperCase()}
        </span>
      </header>

      {/* Bottom controls */}
      <div style={bottomBarStyle}>
        <ControlButton
          label={audioOn ? "MUTE" : "UNMUTE"}
          off={!audioOn}
          icon={audioOn ? "mic" : "mic-off"}
          onClick={toggleAudio}
        />
        <ControlButton
          label={videoOn ? "STOP VIDEO" : "START VIDEO"}
          off={!videoOn}
          icon={videoOn ? "cam" : "cam-off"}
          onClick={toggleVideo}
        />
        <Link href={backHref} aria-label="Hang up" style={hangupStyle}>
          <span aria-hidden style={{ display: "inline-block", transform: "rotate(135deg)", fontSize: 18, lineHeight: 1 }}>📞</span>
        </Link>
      </div>
    </div>
  );
}

function attachVideo(el: HTMLVideoElement | null, p?: DailyParticipant) {
  if (!el) return;
  const stream = new MediaStream();
  const track = p?.tracks?.video?.persistentTrack;
  if (track) stream.addTrack(track);
  if (el.srcObject !== stream) {
    el.srcObject = stream;
    el.play().catch(() => { /* autoplay blocked is OK; iOS resumes on user gesture */ });
  }
}

function attachAudio(el: HTMLAudioElement | null, p?: DailyParticipant) {
  if (!el) return;
  const stream = new MediaStream();
  const track = p?.tracks?.audio?.persistentTrack;
  if (track) stream.addTrack(track);
  if (el.srcObject !== stream) {
    el.srcObject = stream;
    el.play().catch(() => { /* iOS may block until interaction */ });
  }
}

function PipLabel({ text, onCorner }: { text: string; onCorner: "local" | "remote" }) {
  // The label sits inside the PIP tile (the corner). We don't know exactly
  // which DOM node it's on top of — we just position to the corner where the
  // PIP lives. Same coordinates as pipPositionStyle, slightly inset.
  return (
    <div
      aria-hidden
      data-corner={onCorner}
      style={{
        position: "absolute",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
        right: 24,
        zIndex: 4,
        padding: "4px 8px",
        borderRadius: 6,
        background: "rgba(10,14,20,0.7)",
        color: "var(--sky)",
        fontFamily: "var(--font-mono)",
        fontSize: 8,
        letterSpacing: "0.22em",
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function ControlButton({ label, off, icon, onClick }: { label: string; off: boolean; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 56, height: 56, borderRadius: "50%",
        background: off ? "rgba(232,181,168,0.16)" : "rgba(143,184,214,0.14)",
        border: `1px solid ${off ? "rgba(232,181,168,0.5)" : "rgba(143,184,214,0.45)"}`,
        color: off ? "var(--rose)" : "var(--bone)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "background .15s, border-color .15s",
      }}
    >
      {icon === "mic" && <MicIcon muted={false} />}
      {icon === "mic-off" && <MicIcon muted={true} />}
      {icon === "cam" && <CamIcon off={false} />}
      {icon === "cam-off" && <CamIcon off={true} />}
    </button>
  );
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

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "rgba(10,14,20,0.88)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "#000",
  color: "var(--bone)",
  overflow: "hidden",
};

const primaryPositionStyle: React.CSSProperties = {
  position: "absolute",
  top: 0, right: 0, bottom: 0, left: 0,
  width: "100%", height: "100%",
  zIndex: 1,
  transition: "all .35s cubic-bezier(.32,.72,0,1)",
};

const pipPositionStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
  right: 16,
  width: "min(34vw, 180px)",
  aspectRatio: "9 / 16",
  zIndex: 4,
  borderRadius: 18,
  border: "2px solid rgba(143,184,214,0.85)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.6)",
  transition: "all .35s cubic-bezier(.32,.72,0,1)",
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
  background: "linear-gradient(180deg, rgba(10,14,20,0.65), rgba(10,14,20,0))",
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

const bottomBarStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "center",
  gap: 14,
  zIndex: 6,
};

const hangupStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: "50%",
  background: "var(--rose)",
  border: "none",
  color: "var(--ink)",
  display: "flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
};
