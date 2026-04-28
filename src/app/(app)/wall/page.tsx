import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function WallScreen() {
  const filters = [{ l: "ALL", a: true }, { l: "EVENTS" }, { l: "WINS" }, { l: "TRAINERS" }, { l: "CHALLENGES" }, { l: "OPEN MIC" }];

  type Post = {
    n: string; tag?: string; t: string; avatar: string; text: string;
    img?: string; likes: number; comments: number;
    ev?: { tag: string; cta: string }; prog?: boolean; milestone?: { l: string };
  };

  const posts: Post[] = [
    { n: "KAI · TRAINER", tag: "STAFF", t: "14m", avatar: "/assets/blue-hair-gym.jpg", text: "Dropped a new flow. Slow tempo, hard work — Studio B at 6:30P. Pull up.", img: "/assets/IMG_3465.jpg", likes: 124, comments: 18, ev: { tag: "NEW FLOW", cta: "TRY IT" } },
    { n: "AALIYAH M.", t: "1h", avatar: "/assets/IMG_3461.jpg", text: "Day 14 of \"In My Element\" complete. Glutes are gone. Ego intact. 🌊", prog: true, likes: 86, comments: 12 },
    { n: "TASHA · TRAINER", tag: "STAFF", t: "3h", avatar: "/assets/editorial-1.jpg", text: "Sunrise Pilates is officially the move. Mats out at 6:25A sharp. Don't be late, don't be loud.", img: "/assets/floor-mockup.png", likes: 211, comments: 24 },
    { n: "SHAY D.", t: "5h", avatar: "/assets/IMG_3469.jpg", text: "First time hitting the 95lb squat. The whole back row hyped me up. THAT is what membership is.", likes: 342, comments: 41, milestone: { l: "NEW PR · 95 LB SQUAT" } },
    { n: "EVENT · ELEMENT78", tag: "ANNOUNCE", t: "8h", avatar: "/assets/IMG_3471.jpg", text: "May 03 · Sunrise Run + Coffee Meet. 7AM at the lot. Recovery smoothies after.", ev: { tag: "EVENT · MAY 03 · 7A", cta: "RSVP" }, img: "/assets/IMG_3461.jpg", likes: 88, comments: 9 },
  ];

  const stories = [
    { name: "YOU", img: "/assets/blue-hair-selfie.jpg", add: true },
    { name: "KAI", img: "/assets/blue-hair-gym.jpg", live: true },
    { name: "TASHA", img: "/assets/editorial-1.jpg" },
    { name: "AMARA", img: "/assets/dumbbell-street.jpg" },
    { name: "JAY", img: "/assets/IMG_3461.jpg" },
    { name: "SHAY", img: "/assets/IMG_3469.jpg" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <div className="app-scroll" style={{ paddingTop: 20, paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "10px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>FAMILY · TIMELINE · 1,408</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE WALL</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Notifications"><Icon name="bell" size={18} /></button>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--electric)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="New post"><Icon name="plus" size={18} /></button>
          </div>
        </div>

        {/* Stories rail */}
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "12px 22px 16px", overflowX: "auto" }}>
          {stories.map((s, i) => (
            <div key={i} style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", padding: 2,
                background: s.live ? "linear-gradient(135deg, var(--electric), var(--rose))"
                          : s.add ? "transparent"
                          : "linear-gradient(135deg, var(--sky), var(--bone-3))",
                border: s.add ? "1.5px dashed rgba(10,14,20,0.3)" : "none",
                position: "relative",
              }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--bone)" }}>
                  <Photo src={s.img} alt={s.name} style={{ width: "100%", height: "100%" }} />
                </div>
                {s.live && <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", background: "var(--electric)", color: "var(--ink)", padding: "1px 6px", borderRadius: 4, fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em" }}>LIVE</div>}
                {s.add && <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: "var(--ink)", color: "var(--bone)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bone)" }}><Icon name="plus" size={12} /></div>}
              </div>
              <div className="e-mono" style={{ fontSize: 9, marginTop: 6 }}>{s.name}</div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="no-scrollbar" style={{ padding: "0 22px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer",
              background: c.a ? "var(--ink)" : "transparent",
              color: c.a ? "var(--bone)" : "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
            }}>{c.l}</div>
          ))}
        </div>

        {/* Pinned challenge */}
        <div style={{ padding: "4px 22px 10px" }}>
          <div style={{ borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", position: "relative", height: 200 }}>
            <Photo src="/assets/IMG_3471.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.7), rgba(10,14,20,0.85))" }} />
            <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3, alignSelf: "flex-start" }}>CHALLENGE · 6 DAYS LEFT</span>
              <div>
                <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95 }}>21 DAYS<br/>IN MY ELEMENT</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>412 WOMEN IN</div>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.18)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: "67%", height: "100%", background: "var(--sky)" }} />
                  </div>
                  <button className="btn btn-sky" style={{ padding: "8px 14px" }}>I&apos;M IN</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compose row */}
        <div style={{ padding: "16px 22px 6px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <Photo src="/assets/blue-hair-selfie.jpg" alt="" style={{ width: "100%", height: "100%" }} />
          </div>
          <button style={{ flex: 1, padding: "12px 16px", borderRadius: 999, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)", fontSize: 13, color: "rgba(10,14,20,0.5)", textAlign: "left", cursor: "pointer" }}>
            Share something with the family…
          </button>
          <button style={{ width: 38, height: 38, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Live"><Icon name="play" size={14} /></button>
        </div>

        {/* Posts */}
        <div style={{ padding: "12px 22px 4px", display: "flex", flexDirection: "column", gap: 14 }}>
          {posts.map((p, i) => (
            <div key={i} style={{ borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  <Photo src={p.avatar} alt="" style={{ width: "100%", height: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{p.n}</span>
                    {p.tag && <span className="e-mono" style={{ background: p.tag === "ANNOUNCE" ? "var(--rose)" : "var(--sky)", color: "var(--ink)", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>{p.tag}</span>}
                  </div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2 }}>{p.t} · ATL HQ</div>
                </div>
                <span style={{ color: "rgba(10,14,20,0.5)", letterSpacing: "2px" }}>···</span>
              </div>

              <div style={{ padding: "0 14px 12px", fontSize: 14, lineHeight: 1.5 }}>{p.text}</div>

              {p.img && (
                <div style={{ height: 220, position: "relative" }}>
                  <Photo src={p.img} alt="" style={{ position: "absolute", inset: 0 }} />
                  {p.ev && (
                    <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, padding: 10, borderRadius: 10, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="e-tag" style={{ color: "var(--sky)" }}>{p.ev.tag}</span>
                      <button className="btn btn-sky" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 10 }}>{p.ev.cta}</button>
                    </div>
                  )}
                </div>
              )}

              {p.prog && (
                <div style={{ margin: "0 14px 12px", padding: 12, background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(77,169,214,0.05))", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--electric-deep)" }}>14<span style={{ fontSize: 14, opacity: 0.6 }}>/21</span></div>
                  <div style={{ flex: 1 }}>
                    <div className="e-mono" style={{ fontSize: 9, color: "var(--electric-deep)" }}>IN MY ELEMENT · 21 DAY</div>
                    <div style={{ height: 4, background: "rgba(46,127,176,0.2)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ width: "67%", height: "100%", background: "var(--electric-deep)" }} />
                    </div>
                  </div>
                </div>
              )}

              {p.milestone && (
                <div style={{ margin: "0 14px 12px", padding: 12, background: "var(--ink)", color: "var(--bone)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sky)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="flame" size={16} />
                  </div>
                  <div className="e-mono" style={{ fontSize: 10, color: "var(--sky)" }}>{p.milestone.l}</div>
                </div>
              )}

              <div style={{ padding: "12px 14px", display: "flex", gap: 16, alignItems: "center", borderTop: "1px solid rgba(10,14,20,0.06)" }}>
                <button style={{ display: "flex", gap: 5, alignItems: "center", background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer", padding: 0 }}><Icon name="heart" size={16} /><span className="e-mono" style={{ fontSize: 10 }}>{p.likes}</span></button>
                <button style={{ display: "flex", gap: 5, alignItems: "center", background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer", padding: 0 }}><Icon name="crew" size={16} /><span className="e-mono" style={{ fontSize: 10 }}>{p.comments}</span></button>
                <div style={{ marginLeft: "auto" }}><Icon name="arrowUpRight" size={16} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
