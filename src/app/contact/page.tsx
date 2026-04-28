import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function ContactPage() {
  const user = await getUser();
  const channels = [
    { l: "PRESS", e: "press@element78life.com", sub: "Editorial · features · interviews" },
    { l: "WHOLESALE", e: "wholesale@element78life.com", sub: "Stockists · partnerships · capsules" },
    { l: "GENERAL", e: "hello@element78life.com", sub: "Everything else. We answer fast." },
    { l: "CAREERS", e: "careers@element78life.com", sub: "Trainers · floor staff · ops" },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 420 }}>
        <Photo src="/assets/IMG_3471.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 30%, rgba(10,14,20,0.95) 100%)" }} />
        <div style={{ position: "relative", padding: "64px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ ATLANTA · 24/7</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 11vw, 112px)", marginTop: 14, lineHeight: 0.92 }}>SAY HI.</h1>
          <p className="reveal reveal-d2" style={{ marginTop: 18, fontSize: 16, color: "rgba(242,238,232,0.75)", maxWidth: 480, lineHeight: 1.6, fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            Doors open all hours. Inboxes too.
          </p>
        </div>
      </section>

      {/* FORM + CHANNELS */}
      <section style={{ padding: "60px 22px", maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40 }}>
        {/* Form column */}
        <div>
          <div className="e-mono" style={{ color: "var(--sky)" }}>01 / DROP A LINE</div>
          <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 52px)", marginTop: 14, lineHeight: 0.95 }}>WRITE TO US.</h2>
          <p style={{ marginTop: 14, color: "rgba(242,238,232,0.65)", fontSize: 14, lineHeight: 1.6 }}>
            We read everything. Most replies inside 24 hours.
          </p>

          <form
            action="mailto:hello@element78life.com"
            method="POST"
            encType="text/plain"
            style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>NAME</div>
              <input name="name" required placeholder="WHO'S WRITING" className="field-input" />
            </div>
            <div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>EMAIL</div>
              <input name="email" type="email" required placeholder="YOU@SOMEWHERE.COM" className="field-input" />
            </div>
            <div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginBottom: 8, letterSpacing: "0.2em" }}>MESSAGE</div>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="WHAT'S GOOD?"
                className="field-input"
                style={{ resize: "vertical" }}
              />
            </div>
            <button type="submit" className="btn btn-sky" style={{ marginTop: 8 }}>SEND IT</button>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.4)", letterSpacing: "0.2em", marginTop: 4 }}>
              OR EMAIL HELLO@ELEMENT78LIFE.COM DIRECTLY
            </div>
          </form>
        </div>

        {/* Channels column */}
        <div>
          <div className="e-mono" style={{ color: "var(--sky)" }}>02 / DIRECT LINES</div>
          <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 52px)", marginTop: 14, lineHeight: 0.95 }}>BY CHANNEL.</h2>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            {channels.map(c => (
              <a key={c.l} href={`mailto:${c.e}`} className="lift" style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "20px 22px", borderRadius: 16,
                background: "rgba(143,184,214,0.04)",
                border: "1px solid rgba(143,184,214,0.2)",
                color: "var(--bone)", textDecoration: "none",
              }}>
                <div style={{ flex: 1 }}>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{c.l}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 4, letterSpacing: "0.02em" }}>{c.e}</div>
                  <div style={{ fontSize: 12, color: "rgba(242,238,232,0.55)", marginTop: 4 }}>{c.sub}</div>
                </div>
                <Icon name="arrowUpRight" size={18} />
              </a>
            ))}
          </div>

          <div style={{ marginTop: 32, padding: 22, borderRadius: 16, border: "1px solid rgba(143,184,214,0.2)", background: "rgba(143,184,214,0.04)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>VISIT</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6 }}>ATLANTA · FLAGSHIP</div>
            <p style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 10, lineHeight: 1.6 }}>
              Doors open 24/7. Day passes available at the front desk. Bring grip socks.
            </p>
            <Link href="/locations" className="e-mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--sky)" }}>
              SEE THE GYM <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", textAlign: "center" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
        <h2 className="e-display glow" style={{ fontSize: "clamp(40px, 8vw, 64px)", marginTop: 14, lineHeight: 0.95 }}>SKIP THE FORM.<br/>JUST PULL UP.</h2>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <Link href="/join" className="btn btn-sky">JOIN ELEMENT</Link>
          <Link href="/locations" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>SEE THE FLAGSHIP</Link>
        </div>
      </section>

      <SiteFooter />
      {user && <FloatingTabBar />}
    </div>
  );
}
