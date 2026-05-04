"use client";

import { useEffect, useState } from "react";
import { subscribeToPushAction } from "@/lib/push-actions";

/**
 * Mounts the service worker and (optionally) requests web push permission.
 *
 * Two-stage flow:
 *   1. <ServiceWorkerRegister /> — runs unconditionally inside the authed
 *      app shell. Registers /sw.js once and reuses the existing
 *      registration on every nav. Push subscriptions, install prompts,
 *      and offline shell caching all hang off this registration.
 *   2. <EnablePushButton /> — explicit opt-in component the welcome page
 *      and the "REMINDERS" banner render. Asking for permission requires
 *      a user gesture and the prompt can only be shown once per origin —
 *      we keep it gated behind a button click.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // We register against the root scope so the SW can intercept any path
    // a member or coach navigates to. The browser dedupes registration
    // automatically — calling register repeatedly is cheap.
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[sw] register failed:", err.message);
    });
  }, []);
  return null;
}

export type PushSupport = "unsupported" | "default" | "granted" | "denied";

export function detectPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  return Notification.permission as PushSupport;
}

export function EnablePushButton({
  label = "ENABLE PUSH NOTIFICATIONS",
  enabledLabel = "PUSH ON",
  deniedLabel = "PERMISSION BLOCKED",
  unsupportedLabel = "NOT SUPPORTED ON THIS DEVICE",
  className = "btn btn-sky",
  style,
}: {
  label?: string;
  enabledLabel?: string;
  deniedLabel?: string;
  unsupportedLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [state, setState] = useState<PushSupport>("unsupported");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setState(detectPushSupport());
  }, []);

  async function enable() {
    setErr(null);
    if (!VAPID_PUBLIC) {
      setErr("Server VAPID key not configured.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PushSupport);
      if (permission !== "granted") {
        setBusy(false);
        return;
      }

      // Make sure the SW is ready before subscribing — the browser needs
      // an active SW registration to bind the subscription to.
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      // Cast: TypeScript's lib.dom is currently strict about the underlying
      // ArrayBuffer flavor; the runtime accepts a Uint8Array.
      const appKey = urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource;
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey,
      });

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh"));
      const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth"));

      const fd = new FormData();
      fd.set("endpoint", endpoint);
      fd.set("p256dh", p256dh);
      fd.set("auth", auth);
      fd.set("user_agent", navigator.userAgent);
      await subscribeToPushAction(fd);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") {
    return (
      <button type="button" disabled className={className} style={{ ...style, opacity: 0.55, cursor: "not-allowed" }}>
        {unsupportedLabel}
      </button>
    );
  }
  if (state === "granted") {
    return (
      <button type="button" disabled className={className} style={{ ...style, opacity: 0.85 }}>
        ✓ {enabledLabel}
      </button>
    );
  }
  if (state === "denied") {
    return (
      <button type="button" disabled className={className} style={{ ...style, opacity: 0.55, cursor: "not-allowed" }}>
        {deniedLabel}
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button type="button" onClick={enable} disabled={busy} className={className} style={style}>
        {busy ? "ENABLING…" : label}
      </button>
      {err && <span className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--rose)" }}>{err.toUpperCase()}</span>}
    </span>
  );
}
