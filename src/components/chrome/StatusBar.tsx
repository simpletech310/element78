export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "#F2EEE8" : "#0A0E14";
  return (
    <div
      className="standalone-only"
      style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px 0", zIndex: 50,
        color, fontSize: 15, fontWeight: 600,
        pointerEvents: "none",
      }}
    >
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <path d="M1 9.5h2v-2H1v2zm4 0h2v-5H5v5zm4 0h2v-7H9v7zm4 0h2V2h-2v7.5z" fill="currentColor" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 2.5C5.8 2.5 3.8 3.4 2.4 4.8l-1.4-1.4C2.8 1.6 5.3.5 8 .5s5.2 1.1 7 2.9l-1.4 1.4C12.2 3.4 10.2 2.5 8 2.5zm0 4c-1 0-2 .4-2.7 1.1L4 6.3C5.1 5.2 6.5 4.5 8 4.5s2.9.7 4 1.8l-1.3 1.3C10 6.9 9 6.5 8 6.5zm0 4l2-2c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8l2 2z" fill="currentColor" />
        </svg>
        <div style={{ width: 24, height: 11, border: `1px solid ${color}`, borderRadius: 3, position: "relative", opacity: 0.5 }}>
          <div style={{ position: "absolute", inset: 1, background: "currentColor", borderRadius: 1, width: "85%" }} />
        </div>
      </div>
    </div>
  );
}

export function HomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className="standalone-only"
      style={{
        position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
        width: 134, height: 5, borderRadius: 3,
        background: dark ? "rgba(242,238,232,0.4)" : "rgba(10,14,20,0.4)",
        zIndex: 50, pointerEvents: "none",
      }}
    />
  );
}
