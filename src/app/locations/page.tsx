import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listLocations } from "@/lib/data/queries";

export default async function LocationsPage() {
  const locs = await listLocations();
  const primary = locs.find(l => l.status === "active") ?? locs[0];
  const waitlist = locs.filter(l => l.status === "waitlist");
  const waitDates = ["SUMMER '26", "FALL '26", "EARLY '27", "MID '27"];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar />

      {/* HERO */}
      <section style={{ position: "relative", padding: "60px 22px 28px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono reveal" style={{ color: "var(--sky)" }}>NETWORK · {locs.filter(l => l.status==="active").length} LIVE / {waitlist.length} COMING</div>
        <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(48px, 10vw, 96px)", marginTop: 14, lineHeight: 0.92 }}>
          WHERE YOU<br/>AT?
        </h1>
        <p className="reveal reveal-d2" style={{ marginTop: 20, fontSize: 16, color: "rgba(242,238,232,0.7)", maxWidth: 480, lineHeight: 1.6 }}>
          One flagship in Atlanta, four cities on the waitlist. We&apos;re showing up where the culture already lives.
        </p>
      </section>

      {/* MAP */}
      <section style={{ padding: "12px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="reveal reveal-d3" style={{ height: 240, borderRadius: 22, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1a2330 0%, #0A0E14 100%)", border: "1px solid rgba(143,184,214,0.12)" }}>
          <svg viewBox="0 0 320 200" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.16 }}>
            {Array.from({ length: 14 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i*16} x2="320" y2={i*16} stroke="#8FB8D6" strokeWidth="0.4" />)}
            {Array.from({ length: 22 }).map((_, i) => <line key={`v${i}`} x1={i*16} y1="0" x2={i*16} y2="200" stroke="#8FB8D6" strokeWidth="0.4" />)}
            <path d="M0 100 Q80 80 160 105 T320 90" stroke="#8FB8D6" strokeWidth="1" fill="none" opacity="0.4" />
            <path d="M0 140 Q100 125 200 150 T320 135" stroke="#8FB8D6" strokeWidth="1" fill="none" opacity="0.3" />
          </svg>

          {/* ATL pin (active) */}
          <div style={{ position: "absolute", left: "70%", top: "44%" }}>
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", background: "rgba(143,184,214,0.32)", animation: "pulse-ring 2.4s infinite" }} />
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--sky)", border: "3px solid var(--ink)", position: "relative" }} />
            <div className="e-mono" style={{ marginTop: 8, color: "var(--sky)", fontSize: 9, whiteSpace: "nowrap", letterSpacing: "0.2em" }}>ATLANTA HQ</div>
          </div>

          {/* Waitlist pins */}
          {[
            { left: "18%", top: "60%", l: "LA" },
            { left: "44%", top: "76%", l: "HOU" },
            { left: "82%", top: "26%", l: "NYC" },
            { left: "76%", top: "30%", l: "DC" },
          ].map(p => (
            <div key={p.l} style={{ position: "absolute", left: p.left, top: p.top }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px dashed rgba(242,238,232,0.55)" }} />
              <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.45)", fontSize: 8, letterSpacing: "0.2em" }}>{p.l}</div>
            </div>
          ))}

          <div style={{ position: "absolute", top: 14, right: 14, padding: "6px 12px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)", color: "var(--bone)" }} className="e-mono">
            {locs.length} CITIES
          </div>
        </div>
      </section>

      {/* PRIMARY */}
      {primary && (
        <section style={{ padding: "0 22px 60px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 14, letterSpacing: "0.2em" }}>01 / FLAGSHIP</div>
          <Link href="/join" className="lift" style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 380, display: "block", color: "var(--bone)", textDecoration: "none", border: "1px solid rgba(143,184,214,0.12)" }}>
            <Photo src={primary.hero_image ?? "/assets/element78-hero.jpg"} alt={primary.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.92) 100%)" }} />
            <div style={{ position: "absolute", top: 18, left: 18, padding: "5px 11px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)" }} className="e-mono">◉ CURRENT</div>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "var(--bone)" }}>
              <div className="e-mono" style={{ color: "var(--sky)" }}>FLAGSHIP · ELEMENT 78</div>
              <div className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", lineHeight: 0.95, marginTop: 6 }}>{primary.name.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 14, alignItems: "center" }}>
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 10 }}>OPEN 24/7</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(242,238,232,0.4)" }} />
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 10 }}>14 CLASSES TODAY</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(242,238,232,0.4)" }} />
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 10 }}>6 TRAINERS ON DECK</span>
                <span className="btn btn-sky" style={{ marginLeft: "auto", padding: "10px 18px" }}>GET A DAY PASS</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* WAITLIST */}
      <section style={{ padding: "0 22px 60px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em" }}>02 / WAITLIST</div>
          <span className="e-mono" style={{ color: "var(--sky)" }}>{waitlist.length} CITIES IN QUEUE</span>
        </div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>
          NEXT STOPS.
        </h2>
        <p style={{ marginTop: 14, color: "rgba(242,238,232,0.65)", fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>
          Drop your email on a city below — first 100 names get founding-member rates and a key to opening week.
        </p>

        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {waitlist.map((l, i) => (
            <button key={l.id} className="lift" style={{
              display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24,
              padding: 22, borderRadius: 18,
              background: "rgba(143,184,214,0.04)",
              border: "1px dashed rgba(143,184,214,0.32)",
              color: "var(--bone)", cursor: "pointer", textAlign: "left",
              minHeight: 200,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Icon name="pin" size={22} />
                <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{waitDates[i] ?? "SOON"}</span>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, lineHeight: 0.95 }}>{l.name.toUpperCase()}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, marginTop: 8, letterSpacing: "0.18em" }}>JOIN WAITLIST →</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* AI fallback CTA */}
      <section style={{ padding: "0 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <Link href="/train" className="lift" style={{ display: "flex", gap: 18, padding: 24, borderRadius: 20, background: "linear-gradient(135deg, rgba(143,184,214,0.18) 0%, rgba(46,127,176,0.06) 100%)", border: "1px solid rgba(143,184,214,0.25)", alignItems: "center", color: "var(--bone)", textDecoration: "none" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(143,184,214,0.18)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="spark" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>NO GYM IN YOUR CITY?</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 4 }}>THE AI STUDIO TRAVELS WITH YOU.</div>
            <div style={{ fontSize: 13, color: "rgba(242,238,232,0.65)", marginTop: 6 }}>Live avatar coaching in your living room. No reformer needed.</div>
          </div>
          <Icon name="chevron" size={18} />
        </Link>
      </section>
    </div>
  );
}
