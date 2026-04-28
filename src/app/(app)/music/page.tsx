import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";

export default function MusicScreen() {
  const playlists = [
    { t: "WEST COAST FLOW", sub: "88 BPM · 1H 12M", tag: "PILATES", img: "/assets/floor-mockup.png" },
    { t: "SUNRISE STRETCH", sub: "72 BPM · 45M", tag: "AM", img: "/assets/IMG_3467.jpg" },
    { t: "STREET HIIT", sub: "140 BPM · 32M", tag: "STRENGTH", img: "/assets/IMG_3461.jpg" },
    { t: "CANDLELIT", sub: "62 BPM · 1H", tag: "YOGA", img: "/assets/editorial-2.png" },
  ];
  const moods = [{ l: "YOUR FLOW", a: true }, { l: "R&B" }, { l: "AFROBEATS" }, { l: "HIP-HOP" }, { l: "AMBIENT" }, { l: "GOSPEL" }, { l: "WEST COAST" }];
  const tracks = [
    { n: "01", t: "Slow Heat", a: "Snoh Aalegra", d: "3:42", playing: true },
    { n: "02", t: "Breathe Deeper", a: "Sault", d: "4:18" },
    { n: "03", t: "Cellophane", a: "FKA twigs", d: "3:21" },
    { n: "04", t: "Reflections", a: "The Internet", d: "5:02" },
    { n: "05", t: "Midnight Sun", a: "Tems", d: "3:55" },
  ];

  return (
    <div className="app app-dark" style={{ background: "#000", height: "100dvh" }}>
      <StatusBar dark />
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src="/assets/blue-hair-selfie.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.45 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.92) 45%, rgba(10,14,20,1) 100%)" }} />
      </div>

      <div className="app-scroll app-top" style={{ position: "relative", paddingBottom: 220, color: "var(--bone)" }}>
        <div style={{ padding: "14px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "var(--sky)" }}>SOUND · TUNED FOR YOU</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 4, lineHeight: 0.95 }}>WHAT YOU<br/>MOVING TO?</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></button>
        </div>

        <div style={{ padding: "14px 22px 4px" }}>
          <div style={{ padding: 14, borderRadius: 14, background: "linear-gradient(135deg, rgba(143,184,214,0.25), rgba(46,127,176,0.05))", border: "1px solid rgba(143,184,214,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="spark" size={18} /></div>
            <div style={{ flex: 1 }}>
              <div className="e-mono" style={{ fontSize: 9, color: "var(--sky)" }}>SYNCED TO YOUR PACE</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 15, marginTop: 3 }}>Auto-match BPM to your heart rate</div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 999, background: "var(--sky)", position: "relative" }}>
              <div style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--ink)" }} />
            </div>
          </div>
        </div>

        <div className="no-scrollbar" style={{ padding: "14px 22px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
          {moods.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap",
              background: c.a ? "var(--sky)" : "rgba(255,255,255,0.08)",
              color: c.a ? "var(--ink)" : "var(--bone)",
              border: c.a ? "none" : "1px solid rgba(242,238,232,0.18)",
            }}>{c.l}</div>
          ))}
        </div>

        <div style={{ padding: "14px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 10 }}>★ TODAY · CURATED BY KAI</div>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220 }}>
            <Photo src="/assets/blue-hair-gym.jpg" alt="" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95))" }} />
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
              <div className="e-mono" style={{ color: "var(--sky)" }}>PILATES · 88 BPM · 1H 12M</div>
              <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95, marginTop: 4 }}>WEST COAST<br/>FLOW</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <button style={{ width: 44, height: 44, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="play" size={20} /></button>
                <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.7)" }}>18 TRACKS · 4.9★</span>
                <button style={{ marginLeft: "auto", width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 10 }}>UP NEXT</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tracks.map(tr => (
              <div key={tr.n} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                {tr.playing ? (
                  <div style={{ width: 22, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <div style={{ flex: 1, background: "var(--sky)", borderRadius: 1, animation: "equalizer 0.6s ease-in-out infinite", height: 14 }} />
                    <div style={{ flex: 1, background: "var(--sky)", borderRadius: 1, animation: "equalizer 0.8s ease-in-out infinite", height: 8 }} />
                    <div style={{ flex: 1, background: "var(--sky)", borderRadius: 1, animation: "equalizer 0.5s ease-in-out infinite", height: 12 }} />
                  </div>
                ) : (
                  <div className="e-mono" style={{ width: 22, fontSize: 10, color: "rgba(242,238,232,0.4)" }}>{tr.n}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: tr.playing ? "var(--sky)" : "var(--bone)" }}>{tr.t}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 2 }}>{tr.a}</div>
                </div>
                <span className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.5)" }}>{tr.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 10 }}>BUILT FOR THE WORK</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {playlists.map((p, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                <div style={{ aspectRatio: "1", position: "relative" }}>
                  <Photo src={p.img} alt="" style={{ position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(10,14,20,0.85))" }} />
                  <span className="e-mono" style={{ position: "absolute", top: 8, left: 8, padding: "3px 6px", borderRadius: 3, background: "rgba(10,14,20,0.6)", color: "var(--sky)", fontSize: 8 }}>{p.tag}</span>
                  <button style={{ position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="play" size={14} /></button>
                </div>
                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 12, lineHeight: 1.15 }}>{p.t}</div>
                  <div className="e-mono" style={{ fontSize: 8, color: "rgba(242,238,232,0.5)", marginTop: 4 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 12, right: 12, bottom: 92, padding: "10px 12px", borderRadius: 16, background: "rgba(20,28,40,0.92)", backdropFilter: "blur(20px)", border: "1px solid rgba(143,184,214,0.25)", display: "flex", alignItems: "center", gap: 10, color: "var(--bone)", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
          <Photo src="/assets/blue-hair-gym.jpg" alt="" style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--bone)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Slow Heat</div>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 2 }}>SNOH AALEGRA · 88 BPM</div>
          <div style={{ marginTop: 5, height: 2, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "42%", height: "100%", background: "var(--sky)" }} />
          </div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--sky)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="pause" size={16} /></button>
      </div>

      <TabBar />
      <HomeIndicator dark />
    </div>
  );
}
