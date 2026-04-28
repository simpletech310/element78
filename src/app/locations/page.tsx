import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listLocations } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

export default async function LocationsPage() {
  const [locs, user] = await Promise.all([listLocations(), getUser()]);
  const primary = locs.find(l => l.status === "active") ?? locs[0];
  const waitlist = locs.filter(l => l.status === "waitlist");
  const waitDates = ["SUMMER '26", "FALL '26", "EARLY '27", "MID '27"];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

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

      {/* MAP — full-bleed real ATL map (OSM tiles, dark filter, sky pin) */}
      <section className="reveal reveal-d3" style={{ position: "relative", margin: "12px 0 40px", height: "min(520px, 60vh)", overflow: "hidden", background: "var(--ink)", borderTop: "1px solid rgba(143,184,214,0.12)", borderBottom: "1px solid rgba(143,184,214,0.12)" }}>
        <iframe
          title="Atlanta map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-84.55%2C33.65%2C-84.25%2C33.85&amp;layer=mapnik"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            border: "0",
            filter: "invert(0.92) hue-rotate(190deg) saturate(0.55) brightness(1.05) contrast(0.95)",
          }}
          loading="lazy"
        />

        {/* Subtle vignette over the map */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(10,14,20,0.55) 100%)",
        }} />
        {/* Grid overlay for that on-brand atmosphere */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06,
          backgroundImage: "linear-gradient(rgba(143,184,214,1) 1px, transparent 1px), linear-gradient(90deg, rgba(143,184,214,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        {/* Glowing flagship pin overlay (centered on Atlanta) */}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
          <div style={{ position: "relative", width: 28, height: 28 }}>
            <div style={{ position: "absolute", inset: -18, borderRadius: "50%", background: "rgba(143,184,214,0.22)", animation: "pulse-ring 2.6s infinite" }} />
            <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "rgba(143,184,214,0.18)", animation: "pulse-ring 2.6s infinite", animationDelay: "0.6s" }} />
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--sky)", border: "4px solid var(--ink)",
              boxShadow: "0 0 0 2px var(--sky), 0 0 20px rgba(143,184,214,0.6), 0 6px 16px rgba(0,0,0,0.5)",
              position: "relative",
            }} />
          </div>
          <div style={{ marginTop: 12, padding: "6px 14px", borderRadius: 999, background: "rgba(10,14,20,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(143,184,214,0.4)" }}>
            <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>ATLANTA · FLAGSHIP</span>
          </div>
        </div>

        {/* Top corner labels */}
        <div style={{ position: "absolute", top: 18, left: 22, padding: "6px 12px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)", color: "var(--bone)", border: "1px solid rgba(143,184,214,0.2)" }} className="e-mono">
          ◉ LIVE NETWORK
        </div>
        <div style={{ position: "absolute", top: 18, right: 22, padding: "6px 12px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.2)" }} className="e-mono">
          {locs.length} CITIES
        </div>

        {/* Bottom coordinates label */}
        <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)" }} className="e-mono" >
          <span style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.3em" }}>33.749° N · 84.388° W</span>
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

      <SiteFooter />
      {user && <FloatingTabBar />}
    </div>
  );
}
