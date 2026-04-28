import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";
import { Navbar } from "@/components/site/Navbar";
import { listTrainers } from "@/lib/data/queries";

export default async function HomePage() {
  const trainers = await listTrainers();

  const pillars = [
    {
      num: "I", t: "THE GYM", sub: "24-hour access · classes · 1:1",
      desc: "Heavyweight reformer studios, weight floor, recovery lounge. Doors open all night.",
      img: "/assets/blue-hair-gym.jpg", cta: "TOUR THE FLOOR", href: "/locations",
    },
    {
      num: "II", t: "THE STUDIO", sub: "AI-guided sessions, anywhere",
      desc: "Live AI avatars walk you through Pilates, HIIT, and strength flows. Living-room ready.",
      img: "/assets/bridge-pose.jpg", cta: "TRY A SESSION", href: "/train",
    },
    {
      num: "III", t: "THE STORE", sub: "Wear, gear, fuel",
      desc: "The “in my element” line. The tripod water bottle. Built so you can train, then leave the house in it.",
      img: "/assets/hoodie-grey-blonde.jpg", cta: "SHOP THE DROP", href: "/shop",
    },
  ];

  const tiers = [
    { name: "WEEKDAY", sub: "Mon-Fri · 5A-9P", price: "49", best: false, perks: ["Full floor access", "Group classes", "Discounted store"] },
    { name: "ELITE", sub: "24/7 · all access", price: "129", best: true, perks: ["24-hour access", "Unlimited classes", "AI Studio included", "+1 guest pass / mo"] },
    { name: "STUDIO", sub: "App only", price: "19", best: false, perks: ["AI Studio + library", "Crew timeline", "Store member pricing"] },
  ];

  const stats = [
    { v: "1,408", l: "Women in" },
    { v: "78", l: "Signature flows" },
    { v: "4.9", l: "Avg rating" },
    { v: "24/7", l: "Doors open" },
  ];

  const footerCols = [
    { h: "GYM", items: ["Atlanta", "Membership", "Day pass", "Hours"] },
    { h: "STUDIO", items: ["AI sessions", "Programs", "Trainers", "Live classes"] },
    { h: "STORE", items: ["Apparel", "Bottles", "Fuel", "Gift cards"] },
    { h: "CO.", items: ["About", "Press", "Careers", "Wholesale"] },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "min(880px, 100dvh)" }}>
        <Photo src="/assets/element78-hero.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.72 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.85) 80%, var(--ink) 100%)" }} />

        <div style={{ position: "relative", padding: "60px 22px 48px", display: "flex", flexDirection: "column", minHeight: "min(880px, 100dvh)", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)", marginBottom: 18 }}>◉ ATLANTA · OPEN 24/7</div>

          <h1 className="e-display glow glow-pulse reveal reveal-d1" style={{ fontSize: "clamp(72px, 18vw, 168px)", lineHeight: 0.82, margin: 0 }}>
            ELEMENT
          </h1>
          <div className="reveal reveal-d2" style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
            <span className="glow glow-pulse" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(72px, 18vw, 168px)", lineHeight: 0.82 }}>78</span>
            <div style={{ height: 1, background: "var(--sky)", flex: 1, opacity: 0.4 }} />
          </div>

          <p className="reveal reveal-d3" style={{ marginTop: 36, fontSize: "clamp(22px, 4vw, 32px)", fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.15, color: "var(--bone)", maxWidth: 480, marginBottom: 0 }}>
            Pilates with the windows down.
          </p>

          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 440, lineHeight: 1.6, fontWeight: 300 }}>
            A gym, a wardrobe, and an AI studio — built for the women the wellness industry forgot. We brought the culture with us.
          </p>

          <div className="reveal reveal-d4" style={{ marginTop: "auto", paddingTop: 36, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 180 }}>JOIN ELEMENT</Link>
            <button className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>
              <Icon name="play" size={12} />WATCH FILM
            </button>
            <Link href="/login" className="e-mono" style={{ color: "rgba(242,238,232,0.65)", marginLeft: 8 }}>SIGN IN →</Link>
          </div>

          {/* Proof bar */}
          <div className="reveal reveal-d4" style={{ marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(242,238,232,0.12)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {stats.map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 5vw, 32px)", color: "var(--sky)", lineHeight: 1 }}>{s.v}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 6 }}>{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Scroll cue */}
          <div className="float-y" aria-hidden="true" style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.3em" }}>SCROLL</span>
            <div style={{ width: 1, height: 24, background: "rgba(242,238,232,0.4)" }} />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "rgba(10,14,20,0.6)" }}>
        <div className="marquee">
          {[0, 1].map(k => (
            <div key={k} style={{ display: "flex", gap: 32, paddingRight: 32, alignItems: "center", fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              <span>IN MY ELEMENT</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>TRANSFORM EFFORT INTO POWER</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>78 WAYS TO MOVE</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>SOFT &amp; UNMISTAKABLE</span><span style={{ opacity: 0.4 }}>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION HEADER · THE OFFER */}
      <section style={{ padding: "84px 22px 36px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / THE OFFER</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 8vw, 72px)", marginTop: 14, lineHeight: 0.95, marginBottom: 0 }}>
          THREE WAYS<br/>TO BE IN.
        </h2>
        <p style={{ marginTop: 18, color: "rgba(242,238,232,0.65)", fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>
          Pick the door that fits. The gym for the floor. The studio for the living room. The store for the rest of the day.
        </p>
      </section>

      <section style={{ padding: "0 22px", maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {pillars.map((p, i) => {
          const reversed = i % 2 === 1;
          return (
            <Link key={p.num} href={p.href} className="lift" style={{
              position: "relative", borderRadius: 24, overflow: "hidden",
              minHeight: 480, display: "block", color: "var(--bone)", textDecoration: "none",
              border: "1px solid rgba(143,184,214,0.08)",
            }}>
              <Photo src={p.img} alt={p.t} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
              <div style={{
                position: "absolute", inset: 0,
                background: reversed
                  ? "linear-gradient(270deg, rgba(10,14,20,0.95) 10%, rgba(10,14,20,0.2) 60%, transparent 100%)"
                  : "linear-gradient(90deg, rgba(10,14,20,0.95) 10%, rgba(10,14,20,0.2) 60%, transparent 100%)",
              }} />
              <div style={{
                position: "absolute", inset: 0, padding: "36px 32px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                alignItems: reversed ? "flex-end" : "flex-start",
                textAlign: reversed ? "right" : "left",
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "inherit", gap: 10 }}>
                  <span className="e-display glow" style={{ fontSize: 64, lineHeight: 1, letterSpacing: "0.02em" }}>{p.num}</span>
                  <span className="e-mono" style={{ color: "var(--sky)" }}>{p.sub}</span>
                </div>
                <div style={{ maxWidth: 380 }}>
                  <h3 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", lineHeight: 0.95, margin: 0 }}>{p.t}</h3>
                  <p style={{ fontSize: 14, color: "rgba(242,238,232,0.78)", marginTop: 16, lineHeight: 1.6, fontWeight: 300 }}>{p.desc}</p>
                  <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sky)", paddingBottom: 4, borderBottom: "1px solid rgba(143,184,214,0.4)" }}>
                    <span className="e-mono">{p.cta}</span>
                    <Icon name="arrowUpRight" size={14} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* MEMBERSHIP */}
      <section style={{ padding: "96px 22px 60px", background: "var(--bone)", color: "var(--ink)", marginTop: 84 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>02 / JOIN</div>
          <h2 className="e-display" style={{ fontSize: "clamp(40px, 8vw, 72px)", marginTop: 14, lineHeight: 0.95, marginBottom: 18 }}>
            PICK YOUR<br/>ELEMENT.
          </h2>
          <p style={{ color: "rgba(10,14,20,0.65)", fontSize: 15, lineHeight: 1.6, maxWidth: 460 }}>
            Three tiers. No long contracts. Cancel any time, take the streak with you.
          </p>

          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {tiers.map(m => (
              <div key={m.name} style={{
                borderRadius: 18, padding: 22,
                background: m.best ? "var(--ink)" : "transparent",
                color: m.best ? "var(--bone)" : "var(--ink)",
                border: m.best ? "none" : "1px solid rgba(10,14,20,0.15)",
                position: "relative",
              }}>
                {m.best && <span className="e-tag" style={{ position: "absolute", top: -10, left: 22, background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3 }}>MOST PICKED</span>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: "0.02em" }}>{m.name}</div>
                    <div className="e-mono" style={{ fontSize: 10, color: m.best ? "var(--sky)" : "rgba(10,14,20,0.5)", marginTop: 4 }}>{m.sub}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 32 }}>${m.price}</span>
                    <span className="e-mono" style={{ fontSize: 10, opacity: 0.6 }}>/MO</span>
                  </div>
                </div>
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {m.perks.map(pk => (
                    <div key={pk} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14 }}>
                      <span style={{ color: m.best ? "var(--sky)" : "var(--electric-deep)" }}>—</span>
                      <span style={{ opacity: 0.85 }}>{pk}</span>
                    </div>
                  ))}
                </div>
                <Link href="/join" className={m.best ? "btn btn-sky" : "btn btn-ink"} style={{ marginTop: 22, width: "100%" }}>
                  {m.best ? "GO ELITE" : "CHOOSE"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section style={{ padding: "84px 22px", background: "var(--bone)", color: "var(--ink)", borderTop: "1px solid rgba(10,14,20,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>03 / WHY 78</div>
          <p style={{ marginTop: 22, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "clamp(26px, 4vw, 38px)", lineHeight: 1.2, fontWeight: 400, marginBottom: 18 }}>
            Pilates didn’t look like us. So we made it look like home.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(10,14,20,0.75)", maxWidth: 580 }}>
            78 is the atomic number of platinum — soft enough to bend, dense enough not to break. That’s the body we’re building. That’s the woman we’re building it for.
          </p>
        </div>
      </section>

      {/* TEAM */}
      <section style={{ padding: "96px 22px 36px", background: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="e-mono" style={{ color: "var(--sky)" }}>04 / THE TEAM</div>
              <h2 className="e-display" style={{ fontSize: "clamp(40px, 8vw, 72px)", marginTop: 14, lineHeight: 0.95, marginBottom: 0 }}>
                WHO YOU<br/>TRAINING WITH.
              </h2>
            </div>
            <Link href="/trainers" className="e-mono" style={{ color: "var(--sky)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              MEET EVERYONE <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>

          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {trainers.slice(0, 6).map((t, i) => (
              <Link key={t.id} href={`/trainers/${t.slug}`} className="lift" style={{
                display: "block", borderRadius: 18, overflow: "hidden",
                color: "var(--bone)", textDecoration: "none",
                background: "var(--haze)",
                border: "1px solid rgba(143,184,214,0.1)",
              }}>
                <div style={{ position: "relative", aspectRatio: "0.78", overflow: "hidden" }}>
                  <Photo src={t.hero_image ?? t.avatar_url ?? ""} alt={t.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(10,14,20,0.95) 100%)" }} />
                  <div style={{ position: "absolute", top: 16, left: 16, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sky)" }} />
                    <span className="e-mono" style={{ fontSize: 9, color: "var(--sky)" }}>0{i + 1}</span>
                  </div>
                  <div style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>★ {t.rating} · TRAINER</div>
                    <div className="e-display" style={{ fontSize: 30, lineHeight: 0.95, marginTop: 6 }}>{t.name.toUpperCase()}</div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 9, marginTop: 8 }}>
                      {t.specialties.slice(0, 2).join(" · ").toUpperCase()}
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: 14, right: 14, width: 38, height: 38, borderRadius: "50%", background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(143,184,214,0.25)" }}>
                    <Icon name="arrowUpRight" size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SIGNATURE PRODUCT */}
      <section style={{ padding: "60px 22px 96px", background: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Link href="/shop/tripod-bottle" className="lift" style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 540, display: "block", color: "var(--bone)", textDecoration: "none", border: "1px solid rgba(143,184,214,0.08)" }}>
            <Photo src="/assets/bottle-tripod.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.92))" }} />
            <div style={{ position: "absolute", top: 22, left: 22 }}>
              <span className="e-tag" style={{ background: "var(--bone)", color: "var(--ink)", padding: "6px 10px", borderRadius: 3 }}>SIGNATURE</span>
            </div>
            <div style={{ position: "absolute", left: 22, right: 22, bottom: 28, maxWidth: 480 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 8 }}>THE TRIPOD BOTTLE</div>
              <div className="e-display" style={{ fontSize: "clamp(36px, 6vw, 52px)", lineHeight: 0.95 }}>
                HYDRATE.<br/>
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>then film.</span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(242,238,232,0.78)", marginTop: 14, lineHeight: 1.55, fontWeight: 300 }}>
                Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.
              </p>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>$58</span>
                <span className="btn btn-bone" style={{ marginLeft: "auto" }}>SHOP THE BOTTLE</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "84px 22px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(48px, 9vw, 88px)", marginTop: 18, lineHeight: 0.92 }}>
            BE IN YOUR<br/>ELEMENT.
          </h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, marginTop: 18, color: "rgba(242,238,232,0.78)" }}>
            Seven days free. No card up front.
          </p>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>START FREE</Link>
            <Link href="/locations" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>SEE THE GYM</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "60px 22px 40px", background: "var(--ink)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Wordmark size={32} color="var(--sky-soft)" />
          <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.55)", maxWidth: 320, fontWeight: 300 }}>
            78 ways to be in your element.
          </p>

          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 28, fontSize: 13 }}>
            {footerCols.map(c => (
              <div key={c.h}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 10 }}>{c.h}</div>
                {c.items.map(it => (
                  <div key={it} style={{ color: "rgba(242,238,232,0.7)", marginBottom: 6 }}>{it}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="e-mono" style={{ marginTop: 48, color: "rgba(242,238,232,0.4)", fontSize: 9, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span>© ELEMENT 78 · ATLANTA · MMXXVI</span>
            <span>IN MY ELEMENT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
