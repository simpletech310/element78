"use client";

import { useEffect, useState } from "react";

/**
 * Platform-aware install instructions.
 *
 * iOS Safari: no programmatic install API. Show the share-sheet path
 * verbatim because that's the only way (and the most-missed step).
 * Chrome/Android/desktop: capture beforeinstallprompt and offer a real
 * "INSTALL APP" button. Already-installed PWAs hide the whole block.
 */
type Platform = "ios" | "chrome" | "other" | "installed" | "loading";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallHint({ role }: { role: "coach" | "member" }) {
  const [platform, setPlatform] = useState<Platform>("loading");
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari legacy
      window.navigator.standalone === true;
    if (isStandalone) {
      setPlatform("installed");
      return;
    }
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|EdgiOS|FxiOS/.test(ua);
    setPlatform(isIOS ? "ios" : "chrome");

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (platform === "loading") {
    return <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.4)", letterSpacing: "0.2em" }}>CHECKING DEVICE…</div>;
  }

  if (platform === "installed") {
    return (
      <div className="e-mono" style={{ fontSize: 10, color: "var(--sky)", letterSpacing: "0.22em", display: "inline-flex", alignItems: "center", gap: 8 }}>
        ✓ ALREADY INSTALLED · YOU&apos;RE GOOD
      </div>
    );
  }

  if (platform === "ios") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Step n="1" body={<>Tap the <strong>Share</strong> icon in Safari&apos;s bottom bar (the box with the up-arrow).</>} />
        <Step n="2" body={<>Scroll the share sheet and pick <strong>Add to Home Screen</strong>.</>} />
        <Step n="3" body={<>Confirm the name — it should already say <strong>{role === "coach" ? "E78 Coach" : "Element 78"}</strong> — and tap <strong>Add</strong>.</>} />
        <div className="e-mono" style={{ marginTop: 4, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em", lineHeight: 1.5 }}>
          IOS NOTE · NOTIFICATIONS ONLY WORK AFTER YOU INSTALL — IOS REQUIRES THE PWA TO BE ON THE HOME SCREEN BEFORE PUSH BECOMES AVAILABLE.
        </div>
      </div>
    );
  }

  // Chrome / Edge / Brave / Android — beforeinstallprompt flow.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {evt ? (
        <button
          type="button"
          className="btn btn-sky"
          style={{ alignSelf: "flex-start", padding: "12px 18px" }}
          onClick={async () => {
            try {
              await evt.prompt();
              const choice = await evt.userChoice;
              if (choice.outcome === "accepted") setPlatform("installed");
            } catch {
              /* user can still install via menu */
            }
          }}
        >
          INSTALL APP →
        </button>
      ) : (
        <Step n="1" body={<>Open the browser menu (the three dots in the address bar).</>} />
      )}
      <Step n={evt ? "1" : "2"} body={<>If the install button doesn&apos;t appear, choose <strong>Install Element 78{role === "coach" ? " Coach" : ""}</strong> from the browser menu instead.</>} />
      <Step n={evt ? "2" : "3"} body={<>Confirm the prompt — the app lands in your launcher / dock with a real app icon.</>} />
    </div>
  );
}

function Step({ n, body }: { n: string; body: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span className="e-mono" style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
        background: "rgba(143,184,214,0.18)", color: "var(--sky)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, letterSpacing: 0,
      }}>{n}</span>
      <div style={{ fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.55, paddingTop: 2 }}>{body}</div>
    </div>
  );
}
