"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Member-side incoming-call alert. Subscribes to `trainer_bookings` rows for
 * this viewer and shows an on-brand modal the instant the coach hits START
 * SESSION (which stamps `live_started_at` on the booking — see
 * `initiateCallAction` and `startGroupSessionAction`).
 *
 * Mounted globally inside the authed app shell so members get the alert
 * regardless of which screen they're on. The alert dismisses itself if the
 * member taps JOIN (we route them into the session room) or DISMISS.
 *
 * Metadata for the alert (coach name, session title, routine, time) is
 * pre-fetched server-side and passed via `bookings`. The realtime payload
 * carries the row update, but we look up the rich fields from the local map
 * so the modal can render immediately without an extra round-trip.
 */
export type AlertBooking = {
  id: string;
  starts_at: string;
  ends_at: string;
  trainer_name: string;
  session_title: string | null;
  routine_name: string | null;
  mode: "video" | "in_person";
  live_started_at: string | null;
};

type Active = AlertBooking & { startedAt: string };

export function IncomingCallAlert({
  viewerId,
  bookings,
}: {
  viewerId: string;
  bookings: AlertBooking[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<Active | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // If we hydrate and a booking is *already* live (the coach pressed START
  // before the member loaded the page), surface it on mount — but only once
  // per session, so reloads don't keep nagging after dismiss.
  useEffect(() => {
    const live = bookings.find(b => b.live_started_at && !dismissed.has(b.id));
    if (live && !active) {
      setActive({ ...live, startedAt: live.live_started_at! });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewerId || bookings.length === 0) return;
    const sb = createClient();
    const byId = new Map(bookings.map(b => [b.id, b] as const));

    const channel = sb
      .channel(`incoming-calls-${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trainer_bookings",
          filter: `user_id=eq.${viewerId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; live_started_at: string | null };
          const prev = payload.old as { live_started_at: string | null };
          // Only react to a fresh start: null → non-null transition.
          if (!row.live_started_at || prev.live_started_at) return;
          const meta = byId.get(row.id);
          if (!meta) return;
          if (dismissed.has(row.id)) return;
          setActive({ ...meta, startedAt: row.live_started_at });
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [viewerId, bookings, dismissed]);

  // Short beep on modal open — Web Audio API so we don't ship an audio file.
  // 660Hz sine for ~200ms with a tiny attack/release to avoid clicks.
  // Wrapped in try/catch in case the browser blocks autoplay (no user gesture
  // yet). The visual pulsing border stays the primary attention cue.
  useEffect(() => {
    if (!active) return;
    try {
      type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
      osc.onended = () => {
        try { ctx.close(); } catch { /* noop */ }
      };
    } catch {
      // Autoplay blocked or no audio context — silent fall-through.
    }
  }, [active?.id]);

  if (!active) return null;

  const startStr = new Date(active.starts_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  function handleJoin() {
    if (!active) return;
    router.push(`/train/session/${active.id}`);
    setDismissed(prev => new Set(prev).add(active.id));
    setActive(null);
  }

  function handleDismiss() {
    if (!active) return;
    setDismissed(prev => new Set(prev).add(active.id));
    setActive(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Incoming session call"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10,14,20,0.78)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        animation: "incoming-fade 220ms ease-out",
      }}
    >
      <style>{`
        @keyframes incoming-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes incoming-pop { from { transform: scale(0.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes incoming-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(143,184,214,0.45) } 50% { box-shadow: 0 0 0 14px rgba(143,184,214,0) } }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "28px 24px 22px",
          borderRadius: 22,
          background: "linear-gradient(165deg, rgba(46,127,176,0.22), rgba(10,14,20,0.95))",
          border: "1px solid rgba(143,184,214,0.4)",
          color: "var(--bone)",
          textAlign: "center",
          animation: "incoming-pop 280ms cubic-bezier(0.2, 1.2, 0.4, 1)",
          boxShadow: "0 30px 80px rgba(10,14,20,0.55)",
        }}
      >
        <div
          style={{
            margin: "0 auto",
            width: 78,
            height: 78,
            borderRadius: "50%",
            background: "rgba(143,184,214,0.18)",
            border: "1px solid rgba(143,184,214,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "incoming-pulse 1.5s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: 30 }}>📞</span>
        </div>
        <div className="e-mono" style={{ marginTop: 18, color: "var(--sky)", fontSize: 11, letterSpacing: "0.28em" }}>
          ELEMENT 78 · LIVE NOW
        </div>
        <div className="e-display" style={{ marginTop: 8, fontSize: 26, lineHeight: 1.05 }}>
          {active.trainer_name.toUpperCase()} IS<br />CALLING.
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {active.session_title && (
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.78)", fontSize: 11, letterSpacing: "0.18em" }}>
              {active.session_title.toUpperCase()}
            </div>
          )}
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 10, letterSpacing: "0.18em" }}>
            STARTED {startStr} · {active.mode === "video" ? "VIDEO ROOM" : "IN PERSON"}
          </div>
          {active.routine_name && (
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 10, letterSpacing: "0.18em" }}>
              ROUTINE · {active.routine_name.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={handleJoin}
            className="btn btn-sky"
            style={{ padding: "14px 20px", fontSize: 12, letterSpacing: "0.22em" }}
          >
            JOIN NOW →
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="btn"
            style={{
              padding: "12px 20px",
              fontSize: 11,
              letterSpacing: "0.2em",
              background: "transparent",
              color: "rgba(242,238,232,0.55)",
              border: "1px solid rgba(143,184,214,0.25)",
            }}
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
