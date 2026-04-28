import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function DayPassPage() {
  const user = await getUser();

  const includes: { icon: IconName; t: string; sub: string }[] = [
    { icon: "gym", t: "FULL FLOOR ACCESS", sub: "Reformer studios, weight floor, mat rooms — every square foot." },
    { icon: "play", t: "TWO CLASSES", sub: "Drop into any open class on the day. Sign up at the front desk or in-app." },
    { icon: "spark", t: "ONE AI SESSION", sub: "Form-check booth time. Bring a real workout, get real feedback." },
    { icon: "heart", t: "RECOVERY LOUNGE", sub: "Sauna, cold plunge, normatec. 30 minutes on us." },
    { icon: "mic", t: "STUDIO B BOOKING", sub: "Reserve the live-stream studio for content. 60-min slots." },
    { icon: "bottle", t: "ONE BOTTLE", sub: "Tripod bottle to take home. Already filled at the hydration bar." },
  ];

  const filming = [
    { t: "MOUNTED CAMERAS", sub: "Studio B has rigged 4K cameras and a producer's monitor — light it like a film." },
    { t: "LIGHTING THAT WORKS", sub: "Soft sky-blue fill across all studios. Skin tones don't fight the wall." },
    { t: "PRIVATE WHEN YOU WANT IT", sub: "Block the room from public sign-ups. Members only, or just you." },
    { t: "USE OUR TRIPOD", sub: "Or rent the cinema kit — gimbal, mic, key light, all included." },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 540 }}>
        <Photo src="/assets/IMG_3461.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.92) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ DAY PASS · $35</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 12vw, 112px)", marginTop: 18, lineHeight: 0.9 }}>
            POP IN.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 26px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 520 }}>
            One day. The whole floor. The whole studio. The whole shower.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 480, lineHeight: 1.6 }}>
            Visiting Atlanta? Testing the floor before signing up? Just need a quiet hour with the reformer? Day pass is the soft yes.
          </p>
          <div className="reveal reveal-d4" style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-sky" style={{ minWidth: 200 }}>BOOK A DAY</Link>
            <Link href="/atlanta" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>SEE THE FLOOR</Link>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section style={{ padding: "84px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / WHAT&apos;S INCLUDED</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          ONE PASS.<br/>WHOLE BUILDING.
        </h2>
        <p style={{ marginTop: 14, color: "rgba(242,238,232,0.7)", maxWidth: 520, fontSize: 15, lineHeight: 1.6 }}>
          $35. No upsells, no add-ons. The full Atlanta HQ experience for 24 hours from check-in.
        </p>
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {includes.map(f => (
            <div key={f.t} className="lift" style={{ padding: 22, borderRadius: 18, background: "rgba(143,184,214,0.04)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(143,184,214,0.16)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} size={22} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginTop: 14, letterSpacing: "0.02em" }}>{f.t}</div>
              <p style={{ fontSize: 13.5, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.6 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FILM CONTENT */}
      <section style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40, alignItems: "start" }}>
          <div>
            <div className="e-mono" style={{ color: "var(--electric-deep)" }}>02 / FILM IT.</div>
            <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
              CONTENT-READY.<br/>
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>by design.</span>
            </h2>
            <p style={{ marginTop: 18, fontSize: 15, color: "rgba(10,14,20,0.7)", lineHeight: 1.6 }}>
              We built this gym knowing the camera was coming. Lighting that loves your skin. Mounted gear so you don&apos;t fight the angle. Studio B is bookable as a content room — bring your team or rent ours.
            </p>
            <p style={{ marginTop: 14, fontSize: 13, color: "rgba(10,14,20,0.55)", fontStyle: "italic", fontFamily: "var(--font-serif)", lineHeight: 1.5 }}>
              Hydrate. Then film.
            </p>
            <Link href="/contact" className="btn btn-ink" style={{ marginTop: 22 }}>RESERVE STUDIO B</Link>
          </div>
          <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", aspectRatio: "1.1", background: "var(--bone-2)" }}>
            <Photo src="/assets/IMG_3462.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
          </div>
        </div>

        <div style={{ maxWidth: 1180, margin: "32px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {filming.map(f => (
            <div key={f.t} style={{ padding: 18, borderRadius: 14, border: "1px solid rgba(10,14,20,0.12)", background: "var(--paper)" }}>
              <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9, letterSpacing: "0.2em" }}>{f.t}</div>
              <p style={{ fontSize: 13, color: "rgba(10,14,20,0.65)", marginTop: 8, lineHeight: 1.55 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "84px 22px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>03 / HOW IT WORKS</div>
        <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>FOUR STEPS. ONE DAY.</h2>
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { n: "01", t: "BOOK ONLINE", sub: "Pick the day, fill out the waiver. Two minutes." },
            { n: "02", t: "ARRIVE", sub: "Walk up to the concierge — they have your name." },
            { n: "03", t: "SHORT TOUR", sub: "Optional 15-minute walkthrough. Or skip and start." },
            { n: "04", t: "LEAVE BETTER", sub: "Bottle to-go, recovery slot if you want it. Door's open." },
          ].map(s => (
            <div key={s.n} style={{ padding: 22, borderRadius: 18, background: "rgba(143,184,214,0.06)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.3em" }}>{s.n}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 10 }}>{s.t}</div>
              <p style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.55 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>$35 · ONE DAY</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(44px, 8vw, 72px)", marginTop: 14, lineHeight: 0.92 }}>SEE THE FLOOR.<br/>BRING THE CAMERA.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-sky" style={{ minWidth: 200 }}>BOOK A DAY PASS</Link>
            <Link href="/membership" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>SEE MEMBERSHIPS</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
      {user && <FloatingTabBar />}
    </div>
  );
}
