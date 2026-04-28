import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function AtlantaPage() {
  const user = await getUser();

  const features: { icon: IconName; t: string; sub: string }[] = [
    { icon: "gym", t: "REFORMER STUDIOS", sub: "Three glass-walled studios. Top-end Allegro reformers, 14 stations each, never overbooked." },
    { icon: "bolt", t: "WEIGHT FLOOR", sub: "Hammer Strength platforms, dumbbells to 100lb pairs, custom rigs. Built for the work, not the photo." },
    { icon: "spark", t: "AI STATIONS", sub: "Six private booths with mounted cameras + sky-blue ambient light. Form-check on demand." },
    { icon: "heart", t: "RECOVERY LOUNGE", sub: "Infrared sauna, cold plunge, normatec, hydration bar with the in-my-element blend." },
    { icon: "mic", t: "STUDIO B · LIVE", sub: "Filmed and live-streamed. Drop-in for class or hold the floor for a content session." },
    { icon: "user", t: "1:1 PRIVATES", sub: "Private rooms with mirror walls. Book any trainer in 15-minute increments." },
  ];

  const amenities = [
    "Locker rooms with steam + shower towers",
    "Concierge desk staffed 24/7",
    "Black-owned coffee bar in the lobby",
    "Pram + stroller-friendly entrance",
    "EV charging in the lot · Valet on weekends",
    "Concierge laundry — leave your kit",
  ];

  const gallery = [
    "/assets/atlgym.jpg",
    "/assets/IMG_3465.jpg",
    "/assets/floor-mockup.png",
    "/assets/IMG_3467.jpg",
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "min(720px, 92dvh)" }}>
        <Photo src="/assets/atlgym.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.78 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.92) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "min(720px, 92dvh)" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ FLAGSHIP · OPEN 24/7</div>
          <h1 className="e-display glow reveal reveal-d1" style={{ fontSize: "clamp(60px, 14vw, 132px)", lineHeight: 0.86, marginTop: 18 }}>
            ATLANTA<br/>HQ.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 30, fontSize: "clamp(20px, 3.5vw, 28px)", fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.2, color: "var(--bone)", maxWidth: 480 }}>
            State-of-the-art. Soft enough to bend. Dense enough not to break.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.75)", maxWidth: 480, lineHeight: 1.6 }}>
            Our flagship — a luxury gym designed for women, by women. Beautiful. Safe. Loud when you want it, quiet when you don&apos;t. Open every hour of every day.
          </p>
          <div className="reveal reveal-d4" style={{ marginTop: "auto", paddingTop: 36, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/day-pass" className="btn btn-sky" style={{ minWidth: 200 }}>BOOK A DAY PASS</Link>
            <Link href="/membership" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>SEE MEMBERSHIPS</Link>
          </div>
        </div>
      </section>

      {/* THE FLOOR */}
      <section style={{ padding: "96px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / THE FLOOR</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 8vw, 72px)", marginTop: 14, lineHeight: 0.95 }}>
          BUILT FOR<br/>THE WORK.
        </h2>
        <p style={{ marginTop: 18, color: "rgba(242,238,232,0.7)", maxWidth: 540, fontSize: 15, lineHeight: 1.6 }}>
          Equipment selected without compromise. Layout that gives you space. Light that flatters everyone in it.
        </p>

        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {features.map(f => (
            <div key={f.t} className="lift" style={{ padding: 22, borderRadius: 18, background: "rgba(143,184,214,0.04)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(143,184,214,0.16)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} size={22} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 16, letterSpacing: "0.02em" }}>{f.t}</div>
              <p style={{ fontSize: 13.5, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.6 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section style={{ padding: "32px 22px 60px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>02 / THE SPACE</div>
        <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>QUIET LUXURY. LOUD MUSIC.</h2>
        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {gallery.map((src, i) => (
            <div key={i} className="lift" style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: i === 0 ? "1.4" : "1", background: "var(--haze)" }}>
              <Photo src={src} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
            </div>
          ))}
        </div>
      </section>

      {/* AMENITIES */}
      <section style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>03 / DETAILS</div>
          <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>BEYOND THE FLOOR.</h2>
          <p style={{ marginTop: 14, color: "rgba(10,14,20,0.65)", maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
            The little things that make every visit feel like the right call.
          </p>
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {amenities.map(a => (
              <div key={a} style={{ padding: "18px 22px", borderRadius: 12, border: "1px solid rgba(10,14,20,0.12)", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--electric)", flexShrink: 0 }} />
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "84px 22px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(48px, 9vw, 80px)", marginTop: 18, lineHeight: 0.92 }}>
            COME SEE<br/>THE FLOOR.
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, marginTop: 18, color: "rgba(242,238,232,0.78)" }}>
            Day pass · membership · tour. Take the door that fits.
          </p>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/day-pass" className="btn btn-sky" style={{ minWidth: 200 }}>DAY PASS</Link>
            <Link href="/membership" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>MEMBERSHIPS</Link>
            <Link href="/contact" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>BOOK A TOUR</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
