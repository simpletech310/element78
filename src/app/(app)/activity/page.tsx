import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function ActivityScreen() {
  const week = [
    { d: "M", v: 65 }, { d: "T", v: 30 }, { d: "W", v: 80 }, { d: "T", v: 95 },
    { d: "F", v: 50 }, { d: "S", v: 100, today: true }, { d: "S", v: 0 },
  ];
  const prs = [
    { l: "PLANK HOLD", v: "3:14", sub: "+22s vs last" },
    { l: "SQUAT", v: "95 LB", sub: "+10 lb" },
    { l: "HEART RATE", v: "156", sub: "AVG · APR" },
    { l: "VO2 MAX", v: "41.8", sub: "+0.6" },
  ];
  const recent = [
    { t: "Single-Leg Bridge Flow", m: 28, d: "TODAY · 7:14A", cal: 312 },
    { t: "West Coast Flow", m: 60, d: "YESTERDAY · 6:30P", cal: 410 },
    { t: "Core Compton", m: 22, d: "SAT · 8:00A", cal: 248 },
    { t: "Street HIIT", m: 24, d: "FRI · 6:00P", cal: 296 },
  ];

  return (
    <div className="app app-dark" style={{ height: "100dvh" }}>
      <StatusBar dark />
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>YOUR · ACTIVITY</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>IN MOTION</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--haze)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="settings" size={18} />
          </button>
        </div>

        <div style={{ padding: "8px 22px 0" }}>
          <div style={{ borderRadius: 22, padding: 22, background: "linear-gradient(140deg, var(--haze) 0%, rgba(46,127,176,0.25) 130%)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
              <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
                <circle cx="60" cy="60" r="52" stroke="var(--sky)" strokeWidth="10" fill="none" strokeDasharray="326" strokeDashoffset="78" strokeLinecap="round" />
                <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle cx="60" cy="60" r="40" stroke="var(--rose)" strokeWidth="6" fill="none" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--sky)", lineHeight: 1 }}>78%</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 2 }}>WEEKLY GOAL</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="e-mono" style={{ color: "var(--sky)" }}>WEEK 17 · APR 21–27</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 6 }}>4 OF 5<br/>SESSIONS DONE</div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>TIME</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--rose)" }}>3:42</div>
                </div>
                <div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>BURN</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>1,840</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>14-DAY STREAK · 🔥</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 110, padding: 14, borderRadius: 14, background: "var(--haze)" }}>
            {week.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", height: `${Math.max(w.v, 4)}%`, background: w.today ? "var(--sky)" : w.v ? "rgba(143,184,214,0.45)" : "rgba(255,255,255,0.06)", borderRadius: 4 }} />
                <div className="e-mono" style={{ fontSize: 9, color: w.today ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>{w.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>IN PROGRESS</div>
          <div style={{ padding: 14, borderRadius: 14, background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(77,169,214,0.05))", border: "1px solid rgba(143,184,214,0.25)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden" }}>
                <Photo src="/assets/hoodie-grey-blonde-2.jpg" alt="" style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="e-mono" style={{ fontSize: 9, color: "var(--sky)" }}>21-DAY PROGRAM</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 2 }}>IN MY ELEMENT</div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--sky)", letterSpacing: "0.02em" }}>14<span style={{ fontSize: 14, opacity: 0.5 }}>/21</span></div>
            </div>
            <div style={{ height: 4, background: "rgba(143,184,214,0.18)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
              <div style={{ width: "67%", height: "100%", background: "var(--sky)" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>PERSONAL RECORDS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {prs.map(p => (
              <div key={p.l} style={{ padding: 14, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>{p.l}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6, color: "var(--bone)" }}>{p.v}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "var(--sky)", marginTop: 4 }}>↑ {p.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>RECENT SESSIONS</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map((s, i) => (
              <div key={i} style={{ padding: "14px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{s.t}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 4 }}>{s.d}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--sky)" }}>{s.m} MIN</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 4 }}>{s.cal} CAL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar />
      <HomeIndicator dark />
    </div>
  );
}
