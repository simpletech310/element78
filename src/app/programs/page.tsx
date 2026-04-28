import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function ProgramsPage() {
  const user = await getUser();

  const programs = [
    {
      tag: "21 DAYS · DAILY",
      t: "IN MY ELEMENT",
      sub: "Series 03 · the signature reset",
      desc: "Daily Pilates flow + breath work. Slow tempo, hard work. Builds the body — and the streak — back from neutral.",
      img: "/assets/blue-set-rooftop.jpg",
      stats: ["21 sessions", "30–45 min/day", "Beginner → Intermediate"],
    },
    {
      tag: "14 DAYS · STRENGTH",
      t: "CITY OF ANGELS",
      sub: "Outdoor + weight floor",
      desc: "Heavy basics, quick rounds, no filler. Mixes street strength with reformer accessory work. Built to make every other workout feel easier.",
      img: "/assets/dumbbell-street.jpg",
      stats: ["14 sessions", "45 min/day", "Intermediate"],
    },
    {
      tag: "8 SESSIONS · LIVING ROOM",
      t: "LIVING ROOM LUXURY",
      sub: "No equipment, low impact",
      desc: "For travel, recovery weeks, and the days you don&apos;t want to drive. Mat-only Pilates and mobility you can do in 6×6 feet.",
      img: "/assets/bridge-pose.jpg",
      stats: ["8 sessions", "20–30 min", "All levels"],
    },
  ];

  const surfaces: { icon: IconName; t: string; sub: string }[] = [
    { icon: "play", t: "ON THE APP", sub: "Open the program, hit start. AI avatar leads every session, syncs your streak across devices." },
    { icon: "gym", t: "IN THE GYM", sub: "Same program shows up on the Studio B AI stations and in scheduled trainer-led classes." },
    { icon: "crew", t: "IN A CLASS", sub: "Several programs sync with weekly classes — pull up to the floor instead of rolling solo." },
  ];

  const cal = [
    { date: "MAY 5", day: "MON", program: "IN MY ELEMENT · Series 03", spots: "412 enrolled" },
    { date: "MAY 12", day: "MON", program: "CITY OF ANGELS · Drop 02", spots: "186 enrolled" },
    { date: "MAY 19", day: "MON", program: "LIVING ROOM LUXURY · S04", spots: "94 enrolled" },
    { date: "JUN 02", day: "MON", program: "IN MY ELEMENT · Series 04", spots: "Waitlist" },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 540 }}>
        <Photo src="/assets/hoodie-grey-blonde-2.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ STRUCTURED · GUIDED</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 12vw, 112px)", marginTop: 18, lineHeight: 0.9 }}>
            PROGRAMS.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 28px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 520 }}>
            Day-by-day plans. The thinking, done.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 520, lineHeight: 1.6 }}>
            Stop wondering what to do next. Pick a program, start the streak, follow the path. Same program runs in-app, in-gym, and in classes — switch surfaces without breaking the chain.
          </p>
        </div>
      </section>

      {/* PROGRAMS */}
      <section style={{ padding: "84px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / SIGNATURE PROGRAMS</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          THREE PATHS.<br/>ONE STREAK.
        </h2>
        <div style={{ marginTop: 36, display: "grid", gap: 18 }}>
          {programs.map((p, i) => (
            <div key={p.t} className="lift" style={{
              display: "grid",
              gridTemplateColumns: "minmax(280px, 1fr) 2fr",
              gap: 0,
              borderRadius: 22, overflow: "hidden",
              background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)",
            }}>
              <div style={{ position: "relative", minHeight: 280, background: "var(--haze)" }}>
                <Photo src={p.img} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,14,20,0.2), rgba(10,14,20,0.6))" }} />
                <div style={{ position: "absolute", top: 18, left: 18 }}>
                  <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 11px", borderRadius: 999 }}>{p.tag}</span>
                </div>
                <div style={{ position: "absolute", bottom: 18, left: 18, color: "var(--bone)", fontFamily: "var(--font-display)", fontSize: 22 }}>0{i + 1}</div>
              </div>
              <div style={{ padding: "26px 28px" }}>
                <h3 className="e-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 0.95 }}>{p.t}</h3>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, marginTop: 6, letterSpacing: "0.18em" }}>{p.sub}</div>
                <p style={{ fontSize: 14, color: "rgba(242,238,232,0.72)", marginTop: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: p.desc }} />
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {p.stats.map(s => (
                    <span key={s} className="chip-soft" style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}>{s.toUpperCase()}</span>
                  ))}
                </div>
                <Link href="/join" className="btn btn-sky" style={{ marginTop: 20, padding: "10px 18px", fontSize: 10 }}>ENROLL</Link>
              </div>
            </div>
          ))}
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
            Pick once. The program follows you between the app, the studio, and the floor — never resets, never doubles up.
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

      {/* CALENDAR */}
      <section style={{ padding: "84px 22px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>03 / NEXT START DATES</div>
        <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>UPCOMING DROPS.</h2>
        <p style={{ marginTop: 14, color: "rgba(242,238,232,0.7)", maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
          New cohorts every Monday. Enroll any time — you join the cohort that&apos;s starting next.
        </p>
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
          {cal.map(c => (
            <div key={c.date} className="lift" style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 16, background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ minWidth: 72, paddingRight: 18, borderRight: "1px solid rgba(143,184,214,0.2)" }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.25em" }}>{c.day}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{c.date}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>{c.program}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 4, letterSpacing: "0.18em" }}>{c.spots}</div>
              </div>
              <Link href="/join" className="btn" style={{ padding: "10px 18px", background: "var(--sky)", color: "var(--ink)", fontSize: 10 }}>ENROLL</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(40px, 8vw, 64px)", marginTop: 14, lineHeight: 0.95 }}>PICK A PATH.<br/>START THE STREAK.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>JOIN ELEMENT</Link>
            <Link href="/ai-sessions" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>HOW THE AI WORKS</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
