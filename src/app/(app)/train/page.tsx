import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function TrainScreen() {
  const filters = [
    { l: "ALL", active: true }, { l: "PILATES" }, { l: "HIIT" },
    { l: "STRENGTH" }, { l: "YOGA" }, { l: "MOBILITY" },
  ];
  const programs = [
    { t: "IN MY ELEMENT", sub: "21-day reset · daily Pilates flow", dur: "PROGRAM · 21 DAYS", img: "/assets/hoodie-grey-blonde-2.jpg" },
    { t: "CITY OF ANGELS", sub: "Outdoor street strength · LA-built", dur: "PROGRAM · 14 DAYS", img: "/assets/dumbbell-street.jpg" },
    { t: "LIVING ROOM LUXURY", sub: "No-equipment, low-impact, high-result", dur: "SERIES · 8 SESSIONS", img: "/assets/bridge-pose.jpg" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>STUDIO</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>TRAIN</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></button>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="filter" size={18} /></button>
          </div>
        </div>

        <div style={{ padding: "14px 22px" }}>
          <Link href="/train/player" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 460, background: "#000", display: "block", color: "var(--bone)" }}>
            <Photo src="/assets/blue-set-rooftop.jpg" alt="featured" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.5) 0%, rgba(10,14,20,0) 30%, rgba(10,14,20,0) 50%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(10,14,20,0.7)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)", backdropFilter: "blur(10px)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sky)" }} />
                <span className="e-tag">AI GUIDED · LIVE AVATAR</span>
              </div>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)", padding: "6px 10px", borderRadius: 999, color: "var(--bone)" }}>NEW</div>
            </div>
            <div style={{ position: "absolute", top: "36%", left: "50%", transform: "translate(-50%, -50%)", width: 100, height: 100 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid rgba(143,184,214,0.6)", animation: "pulse-ring 2s ease-out infinite" }} />
              <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "1px dashed rgba(143,184,214,0.4)" }} />
              <div style={{ position: "absolute", inset: 24, borderRadius: "50%", background: "rgba(143,184,214,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="spark" size={20} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6 }}>★ AVATAR · ZURI</div>
              <div className="e-display" style={{ fontSize: 44, lineHeight: 0.92 }}>THE WEST<br/>COAST FLOW</div>
              <div style={{ fontSize: 13, color: "rgba(242,238,232,0.75)", marginTop: 10, lineHeight: 1.4, maxWidth: 280 }}>
                28-min reformer-free Pilates set. Slow tempo, hard work. Built for living rooms in LA.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />START SESSION</span>
                <span className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "var(--bone)", border: "1px solid rgba(255,255,255,0.2)", width: 50, padding: 0 }}><Icon name="heart" size={16} /></span>
              </div>
            </div>
          </Link>
        </div>

        <div className="no-scrollbar" style={{ padding: "20px 22px 6px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map((c) => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.active ? "var(--ink)" : "transparent",
              color: c.active ? "var(--bone)" : "var(--ink)",
              border: c.active ? "none" : "1px solid rgba(10,14,20,0.15)",
              whiteSpace: "nowrap",
            }}>{c.l}</div>
          ))}
        </div>

        <div style={{ padding: "16px 22px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div className="e-display" style={{ fontSize: 22 }}>SIGNATURE PROGRAMS</div>
            <div className="e-mono" style={{ color: "var(--electric-deep)" }}>3</div>
          </div>
          {programs.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i < 2 ? "1px solid rgba(10,14,20,0.08)" : "none" }}>
              <div style={{ width: 96, height: 120, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                <Photo src={p.img} alt={p.t} style={{ position: "absolute", inset: 0 }} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 0" }}>
                <div>
                  <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9 }}>{p.dur}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 0.95, marginTop: 4, letterSpacing: "0.02em" }}>{p.t}</div>
                  <div style={{ fontSize: 12, color: "rgba(10,14,20,0.6)", marginTop: 6 }}>{p.sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}>
                  <span className="e-mono" style={{ fontSize: 10 }}>ENROLL</span>
                  <Icon name="arrowUpRight" size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
