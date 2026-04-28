import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function PlayerScreen() {
  return (
    <div className="app app-dark" style={{ background: "#000", height: "100dvh" }}>
      <StatusBar dark />
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src="/assets/bridge-pose.jpg" alt="active session" style={{ position: "absolute", inset: 0, opacity: 0.78 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.7) 0%, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.1) 60%, rgba(10,14,20,0.95) 100%)" }} />
      </div>

      <div className="app-top" style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", color: "var(--bone)", padding: "14px 22px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/train" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chevronDown" size={20} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sky)" }} />
            <span className="e-tag">AI GUIDE · ZURI</span>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="settings" size={18} />
          </button>
        </div>

        {/* Countdown ring */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 240, height: 240, marginTop: 40 }}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="120" cy="120" r="110" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
              <circle cx="120" cy="120" r="110" stroke="var(--sky)" strokeWidth="3" fill="none"
                strokeDasharray={`${2 * Math.PI * 110}`}
                strokeDashoffset={`${2 * Math.PI * 110 * (1 - 0.62)}`}
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 12px rgba(143,184,214,0.6))" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>HOLD</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 84, lineHeight: 1, color: "var(--bone)", textShadow: "0 0 20px rgba(143,184,214,0.4)" }}>0:23</div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, marginTop: 4 }}>SET 02 / 03</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= 2 ? "var(--sky)" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>

        <div>
          <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6, textAlign: "center" }}>MOVE 04 / 11</div>
          <div className="e-display" style={{ fontSize: 36, lineHeight: 0.92, textAlign: "center" }}>SINGLE-LEG BRIDGE</div>
          <div style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 10, textAlign: "center", maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
            Press through the heel. Lift the hip. Hold the squeeze for three.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            {[{ v: "8/12", l: "REPS" }, { v: "142", l: "BPM" }, { v: "14:32", l: "ELAPSED" }].map(s => (
              <div key={s.l} style={{ flex: 1, padding: 12, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(12px)", borderRadius: 12, border: "1px solid rgba(143,184,214,0.18)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)" }}>{s.v}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "38%", height: "100%", background: "var(--sky)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }} className="e-mono">
              <span style={{ color: "rgba(242,238,232,0.5)" }}>14:32</span>
              <span style={{ color: "rgba(242,238,232,0.5)" }}>-23:28</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <button style={{ width: 48, height: 48, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "none", color: "var(--bone)" }}><Icon name="mic" size={20} /></button>
            <button style={{ width: 56, height: 56, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={20} /></span>
            </button>
            <button style={{ width: 76, height: 76, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 6px rgba(143,184,214,0.18)" }}>
              <Icon name="pause" size={24} />
            </button>
            <button style={{ width: 56, height: 56, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="chevron" size={20} />
            </button>
            <button style={{ width: 48, height: 48, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "none", color: "var(--bone)" }}><Icon name="bottle" size={20} /></button>
          </div>
        </div>
      </div>
      <HomeIndicator dark />
    </div>
  );
}
