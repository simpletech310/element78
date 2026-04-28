import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/ui/Icon";

export default function HomePage() {
  const pillars = [
    { num: "I", t: "THE GYM", sub: "24-hour access · classes · 1:1", desc: "Our flagship in Compton. Reformer studios, weight floor, recovery lounge. Open all night.", img: "/assets/blue-hair-gym.jpg", cta: "TOUR THE FLOOR", href: "/locations" },
    { num: "II", t: "THE STUDIO", sub: "AI-guided sessions, anywhere", desc: "Live AI avatars walk you through Pilates, HIIT, and strength flows. Living-room ready.", img: "/assets/bridge-pose.jpg", cta: "TRY A SESSION", href: "/train" },
    { num: "III", t: "THE STORE", sub: "Wear, gear, fuel", desc: "The “in my element” line. The tripod water bottle. Built so you can train, then leave the house in it.", img: "/assets/hoodie-grey-blonde.jpg", cta: "SHOP THE DROP", href: "/shop" },
  ];

  const tiers = [
    { name: "WEEKDAY", sub: "Mon-Fri · 5A-9P", price: "49", best: false, perks: ["Full floor access", "Group classes", "Discounted store"] },
    { name: "ELITE", sub: "24/7 · all access", price: "129", best: true, perks: ["24-hour access", "Unlimited classes", "AI Studio included", "+1 guest pass / mo"] },
    { name: "STUDIO", sub: "App only", price: "19", best: false, perks: ["AI Studio + library", "Crew timeline", "Store member pricing"] },
  ];

  const grid = ["/assets/blue-hair-selfie.jpg","/assets/dumbbell-street.jpg","/assets/pilates-pink.jpg","/assets/hoodie-duo.jpg","/assets/blue-set-rooftop.jpg","/assets/bottle-gym.jpg"];

  const footer = [
    { h: "GYM", items: ["Compton HQ", "Membership", "Day pass", "Hours"] },
    { h: "STUDIO", items: ["AI sessions", "Programs", "Trainers", "Live classes"] },
    { h: "STORE", items: ["Apparel", "Bottles", "Fuel", "Gift cards"] },
    { h: "CO.", items: ["About", "Press", "Careers", "Wholesale"] },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "14px 22px",
        background: "rgba(10,14,20,0.85)", backdropFilter: "blur(14px)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/"><Wordmark size={18} color="var(--bone)" /></Link>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Link href="/shop" aria-label="Shop" style={{ color: "var(--bone)" }}><Icon name="bag" size={18} /></Link>
          <Link href="/login" className="e-mono" style={{ color: "var(--sky)", fontSize: 11 }}>SIGN IN</Link>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative", minHeight: 700 }}>
        <Photo src="/assets/element78-hero.jpg" alt="" style={{ position: "absolute", inset: 0, opacity: 0.7 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.4) 0%, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
        <div style={{ position: "relative", padding: "40px 22px 60px", display: "flex", flexDirection: "column", minHeight: 700 }}>
          <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 14 }}>◉ LIVE FROM COMPTON, CA</div>
          <div className="e-display glow" style={{ fontSize: 78, lineHeight: 0.85 }}>ELEMENT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <span className="glow" style={{ fontFamily: "var(--font-display)", fontSize: 78, lineHeight: 0.85 }}>78</span>
            <div style={{ height: 1, background: "var(--sky)", flex: 1, opacity: 0.4 }} />
          </div>
          <div style={{ marginTop: 30, fontSize: 28, fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.15, color: "var(--bone)", maxWidth: 320 }}>
            Pilates with the windows down.
          </div>
          <div style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", maxWidth: 320, lineHeight: 1.55 }}>
            A gym, a wardrobe, and an AI studio — built for the Black women who never saw themselves in this space. We brought the culture with us.
          </div>
          <div style={{ marginTop: "auto", paddingTop: 30, display: "flex", gap: 10 }}>
            <Link href="/join" className="btn btn-sky" style={{ flex: 1 }}>JOIN ELEMENT</Link>
            <button className="btn btn-ghost" style={{ color: "var(--bone)" }}>
              <Icon name="play" size={12} />FILM
            </button>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div style={{ padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div className="marquee">
          {[0, 1].map((k) => (
            <div key={k} style={{ display: "flex", gap: 28, paddingRight: 28, alignItems: "center", fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              <span>IN MY ELEMENT</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>TRANSFORM EFFORT INTO POWER</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>78 WAYS TO MOVE</span><span style={{ opacity: 0.4 }}>✦</span>
              <span>WEST COAST WELLNESS</span><span style={{ opacity: 0.4 }}>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* THREE PILLARS */}
      <div style={{ padding: "60px 22px 30px" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / THE OFFER</div>
        <div className="e-display" style={{ fontSize: 44, marginTop: 12, lineHeight: 0.95 }}>THREE WAYS<br/>TO BE IN.</div>
      </div>
      {pillars.map((p, i) => (
        <div key={i} style={{ padding: "0 22px 32px" }}>
          <Link href={p.href} style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 480, display: "block", color: "var(--bone)" }}>
            <Photo src={p.img} alt={p.t} style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.15) 30%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <span className="e-display glow" style={{ fontSize: 48, lineHeight: 1 }}>{p.num}</span>
              <span className="e-mono" style={{ color: "var(--sky)", alignSelf: "flex-start", marginTop: 14 }}>{p.sub}</span>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-display" style={{ fontSize: 38, lineHeight: 0.95 }}>{p.t}</div>
              <div style={{ fontSize: 13, color: "rgba(242,238,232,0.75)", marginTop: 10, lineHeight: 1.5 }}>{p.desc}</div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--sky)" }}>
                <span className="e-mono">{p.cta}</span>
                <Icon name="arrowUpRight" size={14} />
              </div>
            </div>
          </Link>
        </div>
      ))}

      {/* MEMBERSHIP */}
      <div style={{ padding: "40px 22px 20px", background: "var(--bone)", color: "var(--ink)" }}>
        <div className="e-mono" style={{ color: "var(--electric-deep)" }}>02 / JOIN</div>
        <div className="e-display" style={{ fontSize: 44, marginTop: 12, lineHeight: 0.95 }}>PICK YOUR<br/>ELEMENT.</div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {tiers.map((m, i) => (
            <div key={i} style={{
              borderRadius: 16, padding: 18,
              background: m.best ? "var(--ink)" : "transparent",
              color: m.best ? "var(--bone)" : "var(--ink)",
              border: m.best ? "none" : "1px solid rgba(10,14,20,0.15)",
              position: "relative",
            }}>
              {m.best && <span className="e-tag" style={{ position: "absolute", top: -8, left: 18, background: "var(--sky)", color: "var(--ink)", padding: "4px 8px", borderRadius: 3 }}>MOST PICKED</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, letterSpacing: "0.02em" }}>{m.name}</div>
                  <div className="e-mono" style={{ fontSize: 10, color: m.best ? "var(--sky)" : "rgba(10,14,20,0.5)", marginTop: 4 }}>{m.sub}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 30 }}>${m.price}</span>
                  <span className="e-mono" style={{ fontSize: 10, opacity: 0.6 }}>/MO</span>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                {m.perks.map((pk) => (
                  <div key={pk} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: m.best ? "var(--sky)" : "var(--electric-deep)" }}>—</span>
                    <span style={{ opacity: 0.85 }}>{pk}</span>
                  </div>
                ))}
              </div>
              <Link href="/join" className={m.best ? "btn btn-sky" : "btn btn-ink"} style={{ marginTop: 18, width: "100%" }}>
                {m.best ? "GO ELITE" : "CHOOSE"}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* MANIFESTO */}
      <div style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)", borderTop: "1px solid rgba(10,14,20,0.08)" }}>
        <div className="e-mono" style={{ color: "var(--electric-deep)" }}>03 / WHY 78</div>
        <div style={{ marginTop: 18, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 30, lineHeight: 1.15 }}>
          Pilates didn’t look like us. So we made it look like home.
        </div>
        <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: "rgba(10,14,20,0.7)" }}>
          78 is the atomic number of platinum — soft enough to bend, dense enough not to break. That’s the body we’re building. That’s the woman we’re building it for.
        </div>
      </div>

      {/* SIGNATURE PRODUCT */}
      <div style={{ padding: "0 22px 32px", background: "var(--bone)" }}>
        <Link href="/shop/tripod-bottle" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 540, background: "var(--bone-2)", display: "block" }}>
          <Photo src="/assets/bottle-tripod.jpg" alt="" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85))" }} />
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <span className="e-tag" style={{ background: "var(--bone)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3 }}>SIGNATURE</span>
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, color: "var(--bone)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6 }}>THE TRIPOD BOTTLE</div>
            <div className="e-display" style={{ fontSize: 36, lineHeight: 0.95 }}>
              HYDRATE.<br/>
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>then film.</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(242,238,232,0.75)", marginTop: 10, maxWidth: 280 }}>
              Insulated 32oz with a built-in phone mount in the cap. Set it up on the mat. Get the angle right.
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>$58</span>
              <span className="btn btn-bone" style={{ marginLeft: "auto" }}>SHOP</span>
            </div>
          </div>
        </Link>
      </div>

      {/* IG GRID */}
      <div style={{ padding: "40px 22px 20px", background: "var(--ink)" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>04 / @ELEMENT78LIFE</div>
        <div className="e-display" style={{ fontSize: 36, marginTop: 12, lineHeight: 0.95 }}>THE FAMILY.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, padding: "0 0 40px" }}>
        {grid.map((src, i) => (
          <div key={i} style={{ aspectRatio: "1", position: "relative" }}>
            <Photo src={src} alt="" style={{ position: "absolute", inset: 0 }} />
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ padding: "40px 22px 30px", background: "var(--ink)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Wordmark size={28} color="var(--sky-soft)" />
        <div style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.55)", maxWidth: 280 }}>
          78 ways to be in your element.
        </div>
        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 13 }}>
          {footer.map((c) => (
            <div key={c.h}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 8 }}>{c.h}</div>
              {c.items.map((it) => (
                <div key={it} style={{ color: "rgba(242,238,232,0.7)", marginBottom: 5 }}>{it}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="e-mono" style={{ marginTop: 36, color: "rgba(242,238,232,0.4)", fontSize: 9 }}>
          © ELEMENT 78 · COMPTON, CA · MMXXVI
        </div>
      </div>
    </div>
  );
}
