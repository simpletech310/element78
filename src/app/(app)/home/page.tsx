import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listClasses } from "@/lib/data/queries";

export default async function HomeScreen() {
  const classes = await listClasses();
  const next = classes[0];
  const dt = next ? new Date(next.starts_at) : null;
  const dayLabel = dt?.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = dt?.getDate();
  const time = dt?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase();

  const studio = [
    { t: "GLUTE BRIDGE FLOW", mins: 18, lvl: "LO", img: "/assets/IMG_3467.jpg", tag: "PILATES" },
    { t: "STREET HIIT", mins: 24, lvl: "HI", img: "/assets/IMG_3465.jpg", tag: "HIIT" },
    { t: "CORE 78", mins: 30, lvl: "MD", img: "/assets/floor-mockup.png", tag: "CORE" },
  ];

  const pulse = [
    { name: "AALIYAH M.", act: "finished CORE 78", time: "2m", img: "/assets/editorial-1.jpg", tag: false },
    { name: "KAI · TRAINER", act: "dropped a new flow", time: "14m", img: "/assets/blue-hair-gym.jpg", tag: true },
  ];

  return (
    <div className="app app-dark" style={{ height: "100dvh" }}>
      <StatusBar dark />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()} / {(new Date().getMonth()+1).toString().padStart(2,"0")}.{new Date().getDate().toString().padStart(2,"0")} / ATL
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 0.95, marginTop: 6, letterSpacing: "0.02em" }}>
              GOOD MORNING,<br/><span style={{ color: "var(--sky)" }}>NAYA.</span>
            </div>
          </div>
          <Link href="/account" aria-label="Account" style={{ position: "relative", display: "block" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--sky)" }}>
              <Photo src="/assets/blue-hair-selfie.jpg" alt="profile" style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--electric)", color: "var(--ink)", borderRadius: 999, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, border: "2px solid var(--ink)" }}>14</div>
          </Link>
        </div>

        {/* Hero — today's ritual */}
        <div style={{ padding: "0 22px" }}>
          <Link href="/train/player" className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 380, background: "#000", display: "block", color: "var(--bone)", textDecoration: "none" }}>
            <Photo src="/assets/IMG_3467.jpg" alt="glute bridge flow" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)" }}>◉ TODAY&apos;S RITUAL</div>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999 }}>42 MIN</div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>SERIES 03 · DAY 14</div>
              <div className="e-display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                LOW-IMPACT<br/>
                <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0 }}>power</span> PILATES
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />BEGIN</span>
                <span className="btn btn-ghost" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)" }}>PREVIEW</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Streak ribbon */}
        <div style={{ padding: "20px 22px 6px", display: "flex", justifyContent: "space-between", gap: 10 }}>
          {[{ k: "14", l: "DAY STREAK" }, { k: "03:42", l: "WK ACTIVE" }, { k: "78%", l: "WEEKLY GOAL" }].map((s) => (
            <div key={s.l} style={{ flex: 1, padding: "14px 12px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", letterSpacing: "0.02em" }}>{s.k}</div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* AI Studio rail */}
        <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>AI STUDIO</div>
          <Link href="/train" className="e-mono" style={{ color: "var(--sky)" }}>SEE ALL →</Link>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
          {studio.map((c, i) => (
            <Link href="/train/player" key={i} className="lift" style={{ minWidth: 200, borderRadius: 16, overflow: "hidden", background: "var(--haze)", flexShrink: 0, color: "var(--bone)", textDecoration: "none" }}>
              <div style={{ position: "relative", height: 220 }}>
                <Photo src={c.img} alt={c.t} style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)" }} />
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span className="e-tag" style={{ background: "rgba(10,14,20,0.65)", backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 4, color: "var(--sky)" }}>{c.tag}</span>
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "var(--electric)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={12} />
                </div>
                <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95 }}>{c.t}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", marginTop: 4, fontSize: 9 }}>{c.mins} MIN · {c.lvl} INTENSITY</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Next at the gym */}
        {next && (
          <div style={{ padding: "28px 22px 12px" }}>
            <div className="e-display" style={{ fontSize: 22, marginBottom: 12 }}>NEXT AT THE GYM</div>
            <Link href={`/gym/classes/${next.id}`} style={{ borderRadius: 16, padding: 16, background: "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(77,169,214,0.05))", border: "1px solid rgba(143,184,214,0.25)", display: "flex", gap: 14, color: "var(--bone)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "12px 0", borderRight: "1px solid rgba(143,184,214,0.2)", paddingRight: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9 }}>{dayLabel}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, marginTop: 2 }}>{dayNum}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 2 }}>{time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>{next.kind?.toUpperCase()} · {next.room}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}>{next.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex" }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: ["var(--sky)","var(--rose)","var(--electric)"][i], marginLeft: i ? -6 : 0, border: "2px solid var(--ink)" }} />
                    ))}
                  </div>
                  <span className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 10 }}>+{next.booked} BOOKED · WITH KAI</span>
                </div>
              </div>
              <Icon name="chevron" size={20} />
            </Link>
          </div>
        )}

        {/* Crew pulse */}
        <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>CREW PULSE</div>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>LIVE · 78</div>
        </div>
        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {pulse.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "var(--haze)", borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Photo src={p.img} alt={p.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{p.name}</span>
                  {p.tag && <span className="e-mono" style={{ background: "var(--sky)", color: "var(--ink)", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>STAFF</span>}
                </div>
                <div style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 2 }}>{p.act}</div>
              </div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.4)", fontSize: 9 }}>{p.time}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator dark />
    </div>
  );
}
