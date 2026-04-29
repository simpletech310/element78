import { Navbar } from "@/components/site/Navbar";

/** Lightweight CoachShell-shaped skeleton used by loading.tsx files. */
export function CoachShellSkeleton({ title }: { title: string }) {
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ borderBottom: "1px solid rgba(143,184,214,0.1)", background: "linear-gradient(180deg, rgba(143,184,214,0.04), transparent 80%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 22px 0" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Pulse style={{ width: 64, height: 64, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <Pulse style={{ width: 200, height: 12, borderRadius: 4 }} />
              <Pulse style={{ width: 280, height: 12, borderRadius: 4, marginTop: 10 }} />
            </div>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Pulse key={i} style={{ width: 80, height: 30, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 22px 100px" }}>
        <Pulse style={{ width: 320, height: 48, borderRadius: 6 }} aria-label={title} />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Pulse key={i} style={{ height: 70, borderRadius: 12 }} />
          ))}
        </div>
      </main>
    </div>
  );
}

function Pulse({ style, ...rest }: { style?: React.CSSProperties; "aria-label"?: string }) {
  return (
    <div
      {...rest}
      style={{
        background: "rgba(143,184,214,0.08)",
        animation: "coach-pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    >
      <style>{`
        @keyframes coach-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
