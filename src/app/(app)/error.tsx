"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary for every authed (app)/* page. If anything
 * inside the segment throws while rendering on the client, Next mounts this
 * instead of the generic "Application error: a client-side exception"
 * overlay. We log the error to the console so the user can read it, surface
 * a brand-styled fallback, and offer a one-click retry that re-runs the
 * server boundary.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", minHeight: "100dvh", fontFamily: "var(--font-body)", padding: "60px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div className="e-mono" style={{ color: "var(--rose)", letterSpacing: "0.28em", fontSize: 11 }}>SOMETHING BROKE</div>
      <h1 className="e-display" style={{ fontSize: "clamp(36px, 8vw, 56px)", lineHeight: 0.95, marginTop: 12, maxWidth: 640 }}>
        WE HIT A SNAG.<br />NOT YOUR FAULT.
      </h1>
      <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6, maxWidth: 460 }}>
        Try again — if it keeps happening, screenshot this and send it over and we&apos;ll fix it fast.
      </p>
      {error.message && (
        <pre className="e-mono" style={{
          marginTop: 18, padding: "12px 14px", borderRadius: 10,
          background: "rgba(232,181,168,0.08)", border: "1px solid rgba(232,181,168,0.25)",
          color: "rgba(242,238,232,0.7)", fontSize: 11, letterSpacing: "0.05em",
          maxWidth: 520, whiteSpace: "pre-wrap", textAlign: "left",
        }}>{error.message}{error.digest ? `\n\nref: ${error.digest}` : ""}</pre>
      )}
      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={() => reset()} className="btn btn-sky" style={{ padding: "12px 22px" }}>
          TRY AGAIN
        </button>
        <Link href="/home" className="btn" style={{ padding: "12px 22px", background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }}>
          GO HOME
        </Link>
      </div>
    </div>
  );
}
