"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectPushSupport } from "@/components/site/PushSetup";

/**
 * Tiny reminder banner the authed app shell mounts. Two states it cares
 * about: "not installed" and "push not enabled". Either one is enough to
 * show the banner. If both are clean, it stays hidden.
 *
 * Detection rules:
 *   - Installed: window.matchMedia('(display-mode: standalone)') OR
 *     navigator.standalone (iOS Safari).
 *   - Push: Notification.permission === 'granted'.
 *
 * Dismissal sticks for 7 days via localStorage so we don't nag, but it's
 * cheap to bring back — the welcome page deep-links to it.
 */
export function PwaReminder() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedAt = Number(localStorage.getItem("e78:pwa-reminder-dismissed-at") ?? "0");
    if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS-only legacy property; not in the lib.dom type.
      window.navigator.standalone === true;
    const push = detectPushSupport();
    const pushOk = push === "granted";

    // Only show if there's something the user can actually do about it.
    if (isStandalone && pushOk) return;
    setShow(true);
  }, []);

  function dismiss() {
    try { localStorage.setItem("e78:pwa-reminder-dismissed-at", String(Date.now())); } catch { /* ignore */ }
    setShow(false);
  }

  if (!show) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
        zIndex: 60,
        padding: "12px 14px",
        borderRadius: 14,
        background: "linear-gradient(135deg, rgba(46,127,176,0.18), rgba(10,14,20,0.92))",
        border: "1px solid rgba(143,184,214,0.32)",
        color: "var(--bone)",
        boxShadow: "0 14px 34px rgba(10,14,20,0.4)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="e-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: "var(--sky)" }}>
          GET THE FULL EXPERIENCE
        </div>
        <div style={{ marginTop: 4, fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.15 }}>
          INSTALL THE APP · ENABLE ALERTS
        </div>
      </div>
      <Link
        href="/welcome?from=reminder"
        className="e-mono"
        style={{
          padding: "8px 12px",
          borderRadius: 999,
          background: "var(--sky)",
          color: "var(--ink)",
          fontSize: 10,
          letterSpacing: "0.22em",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        SET UP →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss reminder"
        className="e-mono"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(242,238,232,0.5)",
          fontSize: 16,
          padding: 6,
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
