"use client";

import Link from "next/link";
import { LiveCall } from "@/components/site/LiveCall";
import type { Routine } from "@/lib/data/routines";
import type { RoutineLiveControl } from "@/components/site/RoutinePlayer";

/**
 * Fullscreen live call surface — coach + member, custom PIP layout.
 *
 * For now this is just the call: two video tiles, full screen, swap on tap,
 * mic/cam toggles, leave. No chat, no Daily chrome, no routine demo. The
 * synced routine player still lives on the regular session page below the
 * stage when the user backs out of the call (?manage=1) — we'll fold it
 * back into the stage as a third surface once the call basics feel right.
 *
 * Mock fallback: when DAILY_API_KEY isn't configured the room URL comes back
 * as mock://… — we render a clear placeholder so the rest of the flow
 * (booking → start → routine page) is testable end-to-end without Daily.
 */
export function LiveSessionStage({
  dailyUrl,
  videoProvider,
  // routine + live control are accepted for forward-compatibility but the
  // current stage doesn't render the routine layer — kept on the props API
  // so the call sites don't have to change when we wire it back in.
  routine: _routine,
  live: _live,
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

  if (isMock) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "var(--ink)",
          color: "var(--bone)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 22,
          textAlign: "center",
        }}
      >
        <Link
          href={backHref}
          style={{
            position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", left: 18,
            padding: "8px 14px", borderRadius: 999,
            background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)",
            color: "var(--bone)", textDecoration: "none",
            border: "1px solid rgba(143,184,214,0.25)",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.24em",
          }}
        >
          ← LEAVE
        </Link>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
          📹 MOCK VIDEO ROOM
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1, color: "var(--bone)" }}>
          DAILY ROOM PENDING.
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: "rgba(242,238,232,0.6)", maxWidth: 480, lineHeight: 1.6 }}>
          Set <code style={{ color: "var(--sky)", fontFamily: "var(--font-mono)" }}>DAILY_API_KEY</code> on the server and restart to swap this for a real call between {isCoach ? "you and your member" : `you and ${trainerName}`}.
        </p>
      </div>
    );
  }

  return (
    <LiveCall
      url={dailyUrl ?? ""}
      trainerName={trainerName}
      isCoach={isCoach}
      backHref={backHref}
    />
  );
}
