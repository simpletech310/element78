"use client";

import { useState } from "react";
import Link from "next/link";
import { DailyEmbed } from "@/components/site/DailyEmbed";
import { RoutinePlayer, type RoutineLiveControl } from "@/components/site/RoutinePlayer";
import type { Routine } from "@/lib/data/routines";

/**
 * Fullscreen live-call stage for an in-progress 1-on-1 or group session.
 *
 * Two media surfaces are mounted side-by-side:
 *   1. The Daily call (faces — coach + member(s)).
 *   2. The synced routine demo video (driven by the coach via realtime
 *      updates on trainer_sessions.routine_state).
 *
 * One is the "primary" — fills the stage area — and the other is a
 * tap-to-swap PIP in the corner. Member default: routine demo primary, call
 * PIP (so they can mirror form first). Coach default: routine demo primary
 * too (they need to see what they're cuing) but they can swap to put the
 * member's face primary any time. Both components stay mounted regardless
 * of which is on top; we just toggle CSS positioning so the Daily call
 * doesn't tear down + rejoin on every swap, and the routine state machine
 * keeps its place.
 *
 * Below the stage, a sticky control bar holds:
 *   - Coach: routine transport (handled by the embedded RoutinePlayer's own
 *     compact controls, which surface inside the routine layer regardless of
 *     PIP/primary state — coach taps "swap" to make the routine primary
 *     when they need to advance).
 *   - Member: a status pill driven by the same routine_state stream.
 *
 * Out of scope: dragging the PIP corner with a pointer (FaceTime-style).
 * That's a quick follow-up — for now the PIP lives in the bottom-right.
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
  // Default: routine demo big, call as PIP. Members tap PIP to flip if they
  // want to see the coach's face primary.
  const [primary, setPrimary] = useState<"routine" | "call">(routine ? "routine" : "call");

  const isMock = !dailyUrl || dailyUrl.startsWith("mock://") || videoProvider === "mock";

  const headerHeight = 60;
  const controlsHeight = 0; // RoutinePlayer compact owns its own bottom controls

  // Stage geometry: top = under header, bottom = above safe area + control rail.
  const stageInset = `${headerHeight}px 0 calc(${controlsHeight}px + env(safe-area-inset-bottom, 0px)) 0`;

  function swap() {
    setPrimary(p => (p === "routine" ? "call" : "routine"));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "var(--ink)",
        color: "var(--bone)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: headerHeight,
          paddingTop: "env(safe-area-inset-top, 0px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 18px 0",
          background: "linear-gradient(180deg, rgba(10,14,20,0.85), rgba(10,14,20,0))",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <Link
          href={backHref}
          aria-label="Leave session"
          style={{
            pointerEvents: "auto",
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)",
            color: "var(--bone)", textDecoration: "none",
            border: "1px solid rgba(143,184,214,0.25)",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.22em",
          }}
        >
          ← LEAVE
        </Link>
        <div className="e-mono" style={{
          padding: "8px 14px", borderRadius: 999,
          background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)",
          color: "var(--sky)", fontSize: 10, letterSpacing: "0.24em",
          border: "1px solid rgba(143,184,214,0.25)",
          pointerEvents: "auto",
        }}>
          ◉ LIVE · {trainerName.toUpperCase()}
        </div>
      </header>

      {/* Routine layer */}
      {routine && (
        <div
          onClick={primary === "routine" ? undefined : swap}
          style={primary === "routine" ? bigStyle(stageInset) : pipStyle()}
          aria-label={primary === "routine" ? "Routine demo (primary)" : "Routine demo (tap to enlarge)"}
        >
          <div style={{ position: "absolute", inset: 0, overflow: primary === "routine" ? "auto" : "hidden", borderRadius: primary === "routine" ? 0 : 18 }}>
            <RoutinePlayer
              routine={routine}
              live={live}
              chrome={primary === "routine" ? "compact" : "compact"}
            />
          </div>
          {primary !== "routine" && <PipBadge label="ROUTINE" />}
        </div>
      )}

      {/* Daily call layer */}
      <div
        onClick={primary === "call" ? undefined : swap}
        style={primary === "call" ? bigStyle(stageInset) : pipStyle({ raise: !routine })}
        aria-label={primary === "call" ? "Video call (primary)" : "Video call (tap to enlarge)"}
      >
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: primary === "call" ? 0 : 18 }}>
          {isMock ? (
            <MockCallPanel />
          ) : (
            <DailyEmbed url={dailyUrl ?? ""} label={isCoach ? "COACH" : "MEMBER"} />
          )}
        </div>
        {primary !== "call" && <PipBadge label={isCoach ? "MEMBER" : trainerName.toUpperCase()} />}
      </div>

      {/* Inline help when both are mounted: tells the user they can tap. */}
      {routine && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
            left: 18,
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(10,14,20,0.55)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(143,184,214,0.25)",
            color: "rgba(242,238,232,0.65)",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.22em",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          TAP THE CORNER TO SWAP
        </div>
      )}
    </div>
  );
}

function bigStyle(inset: string): React.CSSProperties {
  return {
    position: "absolute",
    top: inset.split(" ")[0],
    right: 0,
    bottom: `calc(${inset.split(" ")[2]})`,
    left: 0,
    zIndex: 1,
    transition: "all .35s cubic-bezier(.32,.72,0,1)",
    overflow: "hidden",
  };
}

function pipStyle({ raise = false }: { raise?: boolean } = {}): React.CSSProperties {
  return {
    position: "absolute",
    bottom: `calc(env(safe-area-inset-bottom, 0px) + ${raise ? 18 : 86}px)`,
    right: 16,
    width: "min(38vw, 220px)",
    aspectRatio: "9 / 16",
    zIndex: 4,
    borderRadius: 18,
    overflow: "hidden",
    border: "2px solid var(--sky)",
    boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
    cursor: "pointer",
    transition: "all .35s cubic-bezier(.32,.72,0,1)",
    background: "var(--ink)",
  };
}

function PipBadge({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        padding: "4px 8px",
        borderRadius: 6,
        background: "rgba(10,14,20,0.7)",
        color: "var(--sky)",
        fontFamily: "var(--font-mono)",
        fontSize: 8,
        letterSpacing: "0.2em",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}

function MockCallPanel() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 11 }}>📹 MOCK VIDEO ROOM</div>
      <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: "clamp(20px, 3.5vw, 28px)", lineHeight: 1, color: "var(--bone)" }}>
        DAILY ROOM PENDING.
      </div>
      <p style={{ marginTop: 10, fontSize: 12, color: "rgba(242,238,232,0.6)", maxWidth: 360, lineHeight: 1.6 }}>
        Set DAILY_API_KEY (and optionally DAILY_DOMAIN) on the server to swap this for a real Daily call.
      </p>
    </div>
  );
}
