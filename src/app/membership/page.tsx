import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function MembershipPage() {
  const user = await getUser();

  const tiers = [
    {
      name: "WEEKDAY",
      sub: "Mon-Fri · 5A-9P",
      price: "49",
      best: false,
      perks: [
        "Full floor access during weekday hours",
        "All group classes (excl. signature events)",
        "20% off store, 15% off recovery lounge",
        "Bring a guest 1×/mo (free)",
      ],
    },
    {
      name: "ELITE",
      sub: "24/7 · all access",
      price: "129",
      best: true,
      perks: [
        "24-hour floor + studio access",
        "Unlimited classes, including signature flows",
        "AI Studio (in-app + in-gym AI booths)",
        "Private 1:1 trainer hour each month",
        "+1 guest pass / mo",
        "Founder events + member-only drops",
      ],
    },
    {
      name: "STUDIO",
      sub: "App only · anywhere",
      price: "19",
      best: false,
      perks: [
        "Full AI Studio + program library",
        "The Wall (community + trainer drops)",
        "Member pricing in the store",
        "10-class pack add-on available",
      ],
    },
  ];

  const pillars: { icon: IconName; t: string; sub: string }[] = [
    { icon: "spark", t: "AI TRAINERS", sub: "Form-check, BPM-matched playlists, real-time cues. Available in-app and at our gym AI stations." },
    { icon: "user", t: "HUMAN TRAINERS", sub: "Six certified coaches at the flagship — book privates, take classes, work with the same coach every week." },
    { icon: "cal", t: "CLASSES", sub: "14 a day at the flagship. Reformer, mat, HIIT, yoga, mobility. Every level, every body." },
    { icon: "crew", t: "EVENTS", sub: "Member-only sunrise runs, rooftop classes, founder dinners, content nights." },
    { icon: "heart", t: "COMMUNITY", sub: "1,408 women in. Real friendships in the locker room. The Wall keeps the connection going." },
    { icon: "bag", t: "STORE PERKS", sub: "Member-only drops, early access, line capsules, and 15-20% off everything else." },
  ];

  const faqs = [
    { q: "Can I freeze my membership?", a: "Yes — pause for up to 90 days a year, no questions, two clicks in the app." },
    { q: "Is there a contract?", a: "Month-to-month. Cancel any time. The streak is yours to keep." },
    { q: "Can I bring a friend?", a: "ELITE includes a +1 monthly guest pass. WEEKDAY includes one free guest visit a month." },
    { q: "What about pre/post-natal?", a: "Tasha specializes in this. Tell us at intake — we&apos;ll match you with the right trainer." },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 540 }}>
        <Photo src="/assets/blue-set-rooftop.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.92) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ MEMBERSHIP</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 12vw, 112px)", marginTop: 18, lineHeight: 0.9 }}>
            PICK YOUR<br/>ELEMENT.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 26px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 480 }}>
            Three tiers. Month-to-month. The streak goes with you.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 480, lineHeight: 1.6 }}>
            Every package includes the AI Studio, The Wall, and the in-my-element line. Choose the door that fits how you train.
          </p>
        </div>
      </section>

      {/* TIERS */}
      <section style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>01 / TIERS</div>
          <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>THREE WAYS IN.</h2>

          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {tiers.map(m => (
              <div key={m.name} className="lift" style={{
                borderRadius: 22, padding: 26,
                background: m.best ? "var(--ink)" : "transparent",
                color: m.best ? "var(--bone)" : "var(--ink)",
                border: m.best ? "none" : "1px solid rgba(10,14,20,0.15)",
                position: "relative",
              }}>
                {m.best && <span className="e-tag" style={{ position: "absolute", top: -10, left: 22, background: "var(--sky)", color: "var(--ink)", padding: "5px 10px", borderRadius: 999 }}>MOST PICKED</span>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 30, letterSpacing: "0.02em" }}>{m.name}</div>
                    <div className="e-mono" style={{ fontSize: 10, color: m.best ? "var(--sky)" : "rgba(10,14,20,0.5)", marginTop: 4 }}>{m.sub}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>${m.price}</span>
                    <span className="e-mono" style={{ fontSize: 10, opacity: 0.6 }}>/MO</span>
                  </div>
                </div>
                <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  {m.perks.map(p => (
                    <div key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.45 }}>
                      <span style={{ color: m.best ? "var(--sky)" : "var(--electric-deep)", flexShrink: 0, marginTop: 5 }}>—</span>
                      <span style={{ opacity: 0.88 }}>{p}</span>
                    </div>
                  ))}
                </div>
                <Link href="/join" className={m.best ? "btn btn-sky" : "btn btn-ink"} style={{ marginTop: 26, width: "100%" }}>
                  {m.best ? "GO ELITE" : "CHOOSE"}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 22, color: "rgba(10,14,20,0.55)", fontSize: 13, textAlign: "center" }}>
            Initiation fee waived for the first 100 founding members at every new location.
          </p>
        </div>
      </section>

      {/* WHAT'S INCLUDED — Pillars */}
      <section style={{ padding: "84px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>02 / WHAT YOU GET</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          NOT A GYM.<br/>A NETWORK.
        </h2>
        <p style={{ marginTop: 14, color: "rgba(242,238,232,0.7)", maxWidth: 540, fontSize: 15, lineHeight: 1.6 }}>
          AI that watches your form. Trainers who learn your name. Classes you actually want to be at. A wall full of women who&apos;ve got you.
        </p>

        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {pillars.map(p => (
            <div key={p.t} className="lift" style={{ padding: 22, borderRadius: 18, background: "rgba(143,184,214,0.04)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(143,184,214,0.16)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={p.icon} size={22} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginTop: 14, letterSpacing: "0.02em" }}>{p.t}</div>
              <p style={{ fontSize: 13.5, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.6 }}>{p.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "32px 22px 80px", maxWidth: 720, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>03 / SMALL PRINT</div>
        <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 48px)", marginTop: 14, lineHeight: 0.95, marginBottom: 18 }}>QUICK ANSWERS.</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map(f => (
            <details key={f.q} style={{ borderTop: "1px solid rgba(143,184,214,0.18)", padding: "20px 0" }}>
              <summary style={{ fontFamily: "var(--font-display)", fontSize: 19, letterSpacing: "0.02em", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {f.q}
                <span style={{ color: "var(--sky)" }} className="e-mono">+</span>
              </summary>
              <p style={{ marginTop: 12, color: "rgba(242,238,232,0.7)", fontSize: 14, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(40px, 8vw, 64px)", marginTop: 14, lineHeight: 0.95 }}>START FREE.<br/>STAY AS LONG AS IT&apos;S WORKING.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>JOIN ELEMENT</Link>
            <Link href="/classes" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>SEE CLASSES</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
      {user && <FloatingTabBar />}
    </div>
  );
}
