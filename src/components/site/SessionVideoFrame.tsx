import { DailyEmbed } from "@/components/site/DailyEmbed";

export function SessionVideoFrame({ videoRoomUrl, videoProvider }: { videoRoomUrl: string | null; videoProvider: string | null }) {
  const isMock = !videoRoomUrl || videoRoomUrl.startsWith("mock://") || videoProvider === "mock";

  if (isMock) {
    return (
      <div style={{
        aspectRatio: "16/9", borderRadius: 18, overflow: "hidden",
        background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
        border: "1px solid rgba(143,184,214,0.32)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24, textAlign: "center",
      }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 11 }}>📹 MOCK VIDEO ROOM</div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3.5vw, 32px)", lineHeight: 1, color: "var(--bone)" }}>
          BOTH OF YOU WOULD BE ON DAILY.CO HERE.
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: "rgba(242,238,232,0.6)", maxWidth: 480, lineHeight: 1.6 }}>
          Set <code className="e-mono" style={{ color: "var(--sky)" }}>DAILY_API_KEY</code> and <code className="e-mono" style={{ color: "var(--sky)" }}>DAILY_DOMAIN</code> in env, and{" "}
          <code className="e-mono" style={{ color: "var(--sky)" }}>src/lib/video/provider.ts</code> auto-creates a real Daily room on accept.
        </p>
      </div>
    );
  }

  return <DailyEmbed url={videoRoomUrl ?? ""} />;
}

export function SessionLocked({ startsAt }: { startsAt: string }) {
  const dt = new Date(startsAt);
  const minsAway = Math.round((dt.getTime() - Date.now()) / 60_000);
  return (
    <div style={{
      aspectRatio: "16/9", borderRadius: 18, overflow: "hidden",
      background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NOT YET OPEN</div>
      <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: 28, color: "var(--bone)" }}>
        OPENS 10 MIN BEFORE START
      </div>
      <div className="e-mono" style={{ marginTop: 8, fontSize: 11, color: "rgba(242,238,232,0.55)", letterSpacing: "0.18em" }}>
        {minsAway > 0 ? `${minsAway} MIN AWAY` : "JUST CLOSED"}
      </div>
    </div>
  );
}

export function SessionInPersonPanel() {
  return (
    <div style={{
      borderRadius: 18, padding: 24,
      background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>IN PERSON · GYM</div>
      <h2 className="e-display" style={{ marginTop: 10, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 0.95 }}>
        MEET AT THE GYM.
      </h2>
      <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
        This is a face-to-face session. The routine below will guide both of you through the planned exercises.
      </p>
    </div>
  );
}
