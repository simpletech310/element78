import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { listPrograms, listUserEnrollments } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

export default async function ProgramsPage() {
  const user = await getUser();
  const [programs, enrollments] = await Promise.all([
    listPrograms(),
    user ? listUserEnrollments(user.id) : Promise.resolve([]),
  ]);

  const enrollmentMap = new Map(enrollments.map(e => [e.program.id, e]));

  const surfaces: { icon: IconName; t: string; sub: string }[] = [
    { icon: "play", t: "ON THE APP", sub: "Open the program, hit start. AI avatar leads every session, syncs your streak across devices." },
    { icon: "gym", t: "IN THE GYM", sub: "Same program shows up on the Studio B AI stations and in scheduled trainer-led classes." },
    { icon: "crew", t: "IN A CLASS", sub: "Several programs sync with weekly classes — pull up to the floor instead of rolling solo." },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 540 }}>
        <Photo src="/assets/IMG_3465.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ STRUCTURED · GUIDED · TRACKED</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 12vw, 112px)", marginTop: 18, lineHeight: 0.9 }}>
            PROGRAMS.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 28px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 520 }}>
            Day-by-day plans. The thinking, done.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 520, lineHeight: 1.6 }}>
            Pick a program, enroll, follow the path. Same program runs in-app, in-gym, and in classes — switch surfaces without breaking the chain. Every completed session goes on your record.
          </p>
        </div>
      </section>

      {/* IF AUTHED + ACTIVE PROGRAM — show progress strip up top */}
      {enrollments.filter(e => e.enrollment.status === "active").length > 0 && (
        <section style={{ padding: "44px 22px 0", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR ACTIVE PROGRAMS</div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {enrollments.filter(e => e.enrollment.status === "active").map(({ enrollment, program }) => {
              const pct = Math.min(100, Math.round((Math.max(0, enrollment.current_day - 1) / Math.max(1, program.total_sessions)) * 100));
              return (
                <Link key={enrollment.id} href={`/programs/${program.slug}`} className="lift" style={{
                  display: "flex", gap: 14, padding: 18, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.06))",
                  border: "1px solid rgba(143,184,214,0.3)", color: "var(--bone)", textDecoration: "none",
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--haze)" }}>
                    {program.hero_image && <Photo src={program.hero_image} alt="" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{program.duration_label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.05, marginTop: 4, letterSpacing: "0.02em" }}>{program.name}</div>
                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(143,184,214,0.18)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 8px rgba(143,184,214,0.6)" }} />
                    </div>
                    <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.6)", marginTop: 6, letterSpacing: "0.18em" }}>
                      DAY {enrollment.current_day} / {program.total_sessions} · {pct}%
                    </div>
                  </div>
                  <Icon name="chevron" size={18} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* PROGRAMS LIST */}
      <section style={{ padding: "60px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / SIGNATURE PROGRAMS</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          PICK A PATH.
        </h2>

        <div style={{ marginTop: 36, display: "grid", gap: 18 }}>
          {programs.map((p, i) => {
            const enr = enrollmentMap.get(p.id);
            const cta = enr?.enrollment.status === "active" ? "CONTINUE"
                      : enr?.enrollment.status === "completed" ? "REPEAT"
                      : "ENROLL";
            return (
              <Link key={p.id} href={`/programs/${p.slug}`} className="lift program-card" style={{
                display: "grid",
                gap: 0,
                borderRadius: 22, overflow: "hidden",
                background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none",
              }}>
                <div className="program-card-img" style={{ position: "relative", minHeight: 220, background: "var(--haze)" }}>
                  {p.hero_image && <Photo src={p.hero_image} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,14,20,0.2), rgba(10,14,20,0.65))" }} />
                  <div style={{ position: "absolute", top: 18, left: 18 }}>
                    <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 11px", borderRadius: 999 }}>{p.duration_label}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 18, left: 18, fontFamily: "var(--font-display)", fontSize: 22 }}>0{i + 1}</div>
                </div>
                <div className="program-card-body" style={{ padding: "22px 24px" }}>
                  <h3 className="e-display" style={{ fontSize: "clamp(26px, 4vw, 36px)", lineHeight: 0.95 }}>{p.name}</h3>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, marginTop: 6, letterSpacing: "0.18em" }}>{p.subtitle}</div>
                  <p style={{ fontSize: 14, color: "rgba(242,238,232,0.72)", marginTop: 12, lineHeight: 1.55 }}>{p.description}</p>
                  <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.18em",
                      padding: "5px 11px", borderRadius: 999,
                      background: p.price_cents > 0 ? "var(--sky)" : "rgba(143,184,214,0.16)",
                      color: p.price_cents > 0 ? "var(--ink)" : "var(--sky)",
                      border: p.price_cents > 0 ? "none" : "1px solid rgba(143,184,214,0.3)",
                    }}>{p.price_cents > 0 ? `$${(p.price_cents / 100).toFixed(0)}` : "FREE"}</span>
                    <span className="chip-soft" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>{p.total_sessions} SESSIONS</span>
                    {p.intensity && <span className="chip-soft" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>{p.intensity.toUpperCase()}</span>}
                    {p.surfaces.map(s => (
                      <span key={s} className="chip-soft" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>{s.toUpperCase()}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sky)" }}>
                    <span className="e-mono" style={{ letterSpacing: "0.2em" }}>{cta}</span>
                    <Icon name="arrowUpRight" size={14} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WHERE IT RUNS */}
      <section style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>02 / WHERE IT RUNS</div>
          <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
            ONE PROGRAM,<br/>EVERY ROOM.
          </h2>
          <p style={{ marginTop: 14, color: "rgba(10,14,20,0.65)", maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
            Pick once. The program follows you between the app, the studio, and the floor — never resets, never doubles up. Every session you complete lands in your history.
          </p>
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {surfaces.map(s => (
              <div key={s.t} style={{ padding: 22, borderRadius: 18, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(46,127,176,0.14)", color: "var(--electric-deep)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={s.icon} size={20} />
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 14, letterSpacing: "0.02em" }}>{s.t}</div>
                <p style={{ fontSize: 13.5, color: "rgba(10,14,20,0.65)", marginTop: 8, lineHeight: 1.6 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(40px, 8vw, 64px)", marginTop: 14, lineHeight: 0.95 }}>PICK A PATH.<br/>START THE STREAK.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {!user && <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>JOIN ELEMENT</Link>}
            <Link href="/ai-sessions" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>HOW THE AI WORKS</Link>
            {user && <Link href="/account/history" className="btn btn-sky" style={{ minWidth: 200 }}>YOUR HISTORY</Link>}
          </div>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @media (min-width: 720px) {
          .program-card { grid-template-columns: minmax(280px, 1fr) 2fr !important; }
          .program-card-img { min-height: 280px !important; }
        }
      `}</style>
    </div>
  );
}
