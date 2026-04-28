import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";

function Icon78({ size = 200, rounded = true }: { size?: number; rounded?: boolean }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: rounded ? size * 0.225 : 0,
      background: "radial-gradient(circle at 30% 20%, #4DA9D6 0%, #2E7FB0 35%, #0A0E14 100%)",
      position: "relative", overflow: "hidden",
      boxShadow: rounded ? `0 ${size*0.04}px ${size*0.1}px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)` : "none",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: size * 0.46, lineHeight: 1, color: "#F2EEE8", letterSpacing: "-0.02em", textShadow: `0 0 ${size*0.08}px rgba(143,184,214,0.6)` }}>78</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: size * 0.06, color: "#8FB8D6", marginTop: size * 0.02, letterSpacing: "0.3em" }}>ELEMENT</div>
      </div>
      <div style={{ position: "absolute", top: -size*0.2, right: -size*0.2, width: size*0.5, height: size*0.5, borderRadius: "50%", background: "radial-gradient(circle, rgba(143,184,214,0.4), transparent 70%)" }} />
    </div>
  );
}

export default function AppIconScreen() {
  return (
    <div className="app" style={{ background: "var(--bone)", height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 6px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>BRAND · ICON · APP</div>
          <div className="e-display" style={{ fontSize: 36, marginTop: 4 }}>THE MARK.</div>
        </div>

        <div style={{ padding: "24px 22px 4px", display: "flex", justifyContent: "center" }}>
          <Icon78 size={220} />
        </div>
        <div style={{ padding: "10px 22px 4px", textAlign: "center" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>iOS · 1024 × 1024</div>
        </div>

        <div style={{ padding: "24px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 14 }}>VARIANTS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "end" }}>
            <div style={{ textAlign: "center" }}>
              <Icon78 size={84} />
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 8 }}>STANDARD</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: 19, background: "#F2EEE8", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--ink)" }}>78</div>
              </div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 8 }}>LIGHT</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: 19, background: "#0A0E14", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "#8FB8D6" }}>78</div>
              </div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 8 }}>MONO INK</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>WHY IT WORKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5, color: "rgba(10,14,20,0.78)" }}>
            <div>· The “78” reads instantly small or large — full-bleed display type, no logo lockup needed.</div>
            <div>· Sky-blue glow + ink gradient telegraphs LA dusk, water, calm strength.</div>
            <div>· Mono-ink + light variants for system contexts (notifications, dark mode).</div>
          </div>
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
