import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listLocations } from "@/lib/data/queries";

export default async function LocationsPage() {
  const locs = await listLocations();
  const primary = locs.find(l => l.status === "active" && l.sort_order === 1) ?? locs[0];
  const otherActive = locs.filter(l => l.status === "active" && l.id !== primary?.id);
  const waitlist = locs.filter(l => l.status === "waitlist");
  const waitDates = ["SUMMER '26", "FALL '26", "EARLY '27", "MID '27"];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 60 }}>
        <div style={{ padding: "14px 22px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.06)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          </Link>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="search" size={18} />
          </button>
        </div>

        <div style={{ padding: "6px 22px 8px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>YOUR HOMES · {locs.filter(l => l.status==="active").length} LIVE</div>
          <div className="e-display" style={{ fontSize: 36, marginTop: 4, lineHeight: 0.95 }}>WHERE YOU AT?</div>
        </div>

        <div style={{ padding: "12px 22px 4px" }}>
          <div style={{ height: 180, borderRadius: 16, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1a2330 0%, #0A0E14 100%)" }}>
            <svg viewBox="0 0 320 180" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}>
              {Array.from({ length: 12 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i*16} x2="320" y2={i*16} stroke="#8FB8D6" strokeWidth="0.5" />)}
              {Array.from({ length: 20 }).map((_, i) => <line key={`v${i}`} x1={i*18} y1="0" x2={i*18} y2="180" stroke="#8FB8D6" strokeWidth="0.5" />)}
              <path d="M0 90 Q80 70 160 95 T320 80" stroke="#8FB8D6" strokeWidth="1" fill="none" opacity="0.4" />
              <path d="M0 130 Q100 115 200 140 T320 125" stroke="#8FB8D6" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
            <div style={{ position: "absolute", left: "70%", top: "44%" }}>
              <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "rgba(143,184,214,0.3)", animation: "pulse-ring 2s infinite" }} />
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--sky)", border: "3px solid var(--ink)", position: "relative" }} />
              <div className="e-mono" style={{ marginTop: 6, color: "var(--sky)", fontSize: 9, whiteSpace: "nowrap" }}>ATLANTA HQ</div>
            </div>
            <div style={{ position: "absolute", left: "52%", top: "72%" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "transparent", border: "2px dashed rgba(242,238,232,0.6)" }} />
            </div>
            <div style={{ position: "absolute", left: "88%", top: "20%" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "transparent", border: "2px dashed rgba(242,238,232,0.6)" }} />
            </div>
            <div style={{ position: "absolute", top: 12, right: 12, padding: "5px 10px", borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)" }} className="e-mono">
              {locs.length} LOCATIONS
            </div>
          </div>
        </div>

        {primary && (
          <div style={{ padding: "20px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>YOUR PRIMARY</div>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 220 }}>
              <Photo src={primary.hero_image ?? "/assets/element78-hero.jpg"} alt="" style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(10,14,20,0.95))" }} />
              <div style={{ position: "absolute", top: 14, left: 14, padding: "5px 10px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)" }} className="e-mono">◉ CURRENT</div>
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, color: "var(--bone)" }}>
                <div className="e-mono" style={{ color: "var(--sky)" }}>FLAGSHIP · ELEMENT 78</div>
                <div className="e-display" style={{ fontSize: 30, lineHeight: 0.95, marginTop: 4 }}>{primary.name.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
                  <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9 }}>OPEN 24/7</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(242,238,232,0.4)" }} />
                  <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9 }}>14 CLASSES TODAY</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {otherActive.length > 0 && (
          <div style={{ padding: "20px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>ALSO LIVE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {otherActive.map(l => (
                <div key={l.id} style={{ display: "flex", gap: 14, padding: 12, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <Photo src={l.hero_image ?? ""} alt="" style={{ width: "100%", height: "100%" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rose)" }} />
                      <span className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>SISTER LOCATION</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, marginTop: 4, lineHeight: 1.05 }}>{l.name.toUpperCase()}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }} className="e-mono">
                      <span style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>OPEN 24/7</span>
                    </div>
                  </div>
                  <button style={{ alignSelf: "center", padding: "8px 12px", borderRadius: 999, background: "transparent", border: "1px solid rgba(10,14,20,0.2)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em" }}>SET</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "20px 22px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>COMING SOON</span>
            <span className="e-mono" style={{ color: "var(--electric-deep)" }}>JOIN WAITLIST →</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {waitlist.map((l, i) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", borderRadius: 12, border: "1px dashed rgba(10,14,20,0.2)" }}>
                <Icon name="pin" size={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{l.name.toUpperCase()}</div>
                </div>
                <span className="e-tag" style={{ background: "var(--ink)", color: "var(--sky)", padding: "4px 9px", borderRadius: 3 }}>{waitDates[i] ?? "SOON"}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <Link href="/train" style={{ padding: 16, borderRadius: 14, background: "var(--ink)", color: "var(--bone)", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(143,184,214,0.18)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="spark" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>NO GYM NEAR YOU?</div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 4 }}>AI STUDIO WORKS ANYWHERE.</div>
            </div>
            <Icon name="chevron" size={16} />
          </Link>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}
