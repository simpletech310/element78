"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";

/**
 * Daily Prebuilt embed using `@daily-co/daily-js` rather than a raw iframe.
 *
 * The SDK lets us set the theme programmatically — `?t=` URL params work on
 * desktop but get dropped or ignored on iOS Safari first-load (Daily redirects
 * inside the iframe and the param goes missing). Calling `setTheme()` after
 * the call object exists works consistently across desktop, Android Chrome,
 * and iOS Safari.
 */
export function DailyEmbed({ url, label }: { url: string; label?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    if (callRef.current) return; // never mount twice

    const ink = "#0a0e14";
    const bone = "#f2eee8";
    const sky = "#8fb8d6";

    // Wrap createFrame + join in try/catch so a malformed URL, missing
    // browser API, or Daily SDK throw never surfaces as the page-killing
    // "client-side exception" overlay. We report the failure inline instead
    // so the rest of the session room (routine player, complete form,
    // roster) keeps rendering.
    let call: DailyCall;
    try {
      call = DailyIframe.createFrame(containerRef.current, {
        url,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          background: ink,
        },
        showLeaveButton: true,
        showFullscreenButton: true,
        theme: {
          colors: {
            accent: sky,
            accentText: ink,
            background: ink,
            backgroundAccent: ink,
            baseText: bone,
            border: "rgba(143,184,214,0.3)",
            mainAreaBg: ink,
            mainAreaBgAccent: "rgba(143,184,214,0.05)",
            mainAreaText: bone,
            supportiveText: "rgba(242,238,232,0.7)",
          },
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[daily] createFrame failed:", err);
      setInitError((err as Error).message || "Couldn't initialize the call.");
      return;
    }

    callRef.current = call;
    call.join().catch((err: { errorMsg?: string; message?: string }) => {
      // eslint-disable-next-line no-console
      console.warn("[daily] join failed:", err);
      setInitError(err?.errorMsg || err?.message || "Couldn't connect to the call.");
    });

    return () => {
      call.leave().catch(() => {});
      call.destroy().catch(() => {});
      callRef.current = null;
    };
  }, [url]);

  if (initError) {
    return (
      <div
        style={{
          aspectRatio: "16/9", borderRadius: 18, overflow: "hidden",
          background: "linear-gradient(135deg, rgba(232,181,168,0.18), rgba(10,14,20,0.95))",
          border: "1px solid rgba(232,181,168,0.4)",
          color: "var(--bone)",
          padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}
      >
        <div className="e-mono" style={{ color: "var(--rose)", fontSize: 11, letterSpacing: "0.25em" }}>VIDEO ROOM · COULDN&apos;T START</div>
        <p style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.55, maxWidth: 480 }}>{initError}</p>
        <p style={{ marginTop: 8, fontSize: 12, color: "rgba(242,238,232,0.55)", lineHeight: 1.55, maxWidth: 480 }}>
          Refresh to retry. If this keeps happening, check the server&apos;s DAILY_API_KEY / DAILY_DOMAIN env or the room URL.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", background: "var(--ink)" }}>
      {/* Branded chrome strip — points up that the call is hosted in-app. */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 2,
          padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(180deg, rgba(10,14,20,0.7) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      >
        <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>
          ◉ ELEMENT 78 · LIVE{label ? ` · ${label}` : ""}
        </span>
        <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.2em" }}>
          DAILY · ENCRYPTED
        </span>
      </div>

      {/* Daily mounts its iframe inside this container. */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
