import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";

export default async function AISessionsPage() {
  const user = await getUser();

  const features: { icon: IconName; t: string; sub: string }[] = [
    { icon: "spark", t: "FORM CHECK · LIVE", sub: "Your phone (or a gym camera) watches you move. The avatar calls form fixes in real time — knee tracking, hip alignment, depth, tempo." },
    { icon: "play", t: "GUIDED FLOWS", sub: "28 minutes of Pilates, 24 minutes of HIIT, 35 minutes of street strength. Slow tempo, hard work, real cues." },
    { icon: "mic", t: "VOICE COACHING", sub: "Hands-free count-in, breath cues, BPM-matched soundtrack — designed to feel like a trainer in the room." },
    { icon: "fire", t: "PROGRESSIVE LOAD", sub: "The system reads how hard yesterday was and tunes today. Intensity that meets you where you actually are." },
    { icon: "flame", t: "STREAK + GOALS", sub: "Set a weekly goal, track it, celebrate it. The streak goes with you across in-app and in-gym sessions." },
    { icon: "heart", t: "RECOVERY MODE", sub: "Restorative flows when your watch says you slept badly. Mobility drills when you sat all day." },
  ];

  const surfaces = [
    {
      tag: "IN APP",
      t: "LIVING ROOM READY.",
      sub: "Open the app, prop your phone, hit play. Works on a yoga mat in 6×6 feet. Avatars run on-device — no laggy stream.",
      img: "/assets/editorial-2.png",
      cta: "TRY A SESSION",
      href: "/join",
    },
    {
      tag: "IN GYM",
      t: "AI STATIONS · STUDIO B",
      sub: "Six private booths at the Atlanta flagship. Bigger screen, mounted camera, sky-blue ambient light. Member access included.",
      img: "/assets/atlgym.jpg",
      cta: "BOOK A STATION",
      href: "/atlanta",
    },
  ];

  const avatars = [
    { name: "ZURI", spec: "Pilates · Reformer · Mobility", img: "/assets/floor-mockup.png" },
    { name: "MARI", spec: "HIIT · Functional · Conditioning", img: "/assets/IMG_3469.jpg" },
    { name: "LEILA", spec: "Yoga · Breathwork · Recovery", img: "/assets/editorial-2.png" },
  ];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 580 }}>
        <Photo src="/assets/IMG_3467.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.6) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ AI STUDIO · LIVE AVATAR</div>
          <h1 className="e-display glow reveal reveal-d1" style={{ fontSize: "clamp(56px, 13vw, 124px)", marginTop: 18, lineHeight: 0.88 }}>
            AI THAT<br/>WATCHES.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 28px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 520 }}>
            A trainer, in your phone. A trainer, in our studio.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 480, lineHeight: 1.6 }}>
            Live AI avatars walk you through every flow — Pilates, HIIT, strength, mobility — checking your form in real time, picking the right tempo, calling your reps.
          </p>
          <div className="reveal reveal-d4" style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>START FREE</Link>
            <Link href="/programs" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>SEE PROGRAMS</Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "84px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / WHAT IT DOES</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          NOT A VIDEO.<br/>A COACH.
        </h2>
        <p style={{ marginTop: 14, color: "rgba(242,238,232,0.7)", maxWidth: 540, fontSize: 15, lineHeight: 1.6 }}>
          The difference is the eye. Every session reads your body, not the playbook.
        </p>
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {features.map(f => (
            <div key={f.t} className="lift" style={{ padding: 24, borderRadius: 18, background: "rgba(143,184,214,0.04)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(143,184,214,0.16)", color: "var(--sky)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} size={22} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 16, letterSpacing: "0.02em" }}>{f.t}</div>
              <p style={{ fontSize: 13.5, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.6 }}>{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SURFACES */}
      <section style={{ padding: "32px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>02 / WHERE IT LIVES</div>
        <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>
          IN YOUR HAND.<br/>IN OUR HOUSE.
        </h2>
        <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          {surfaces.map(s => (
            <Link key={s.tag} href={s.href} className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", minHeight: 380, color: "var(--bone)", textDecoration: "none", display: "block", border: "1px solid rgba(143,184,214,0.12)" }}>
              <Photo src={s.img} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.3) 30%, rgba(10,14,20,0.95) 100%)" }} />
              <div style={{ position: "absolute", top: 18, left: 18 }}>
                <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "6px 11px", borderRadius: 999 }}>{s.tag}</span>
              </div>
              <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
                <h3 className="e-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 0.95 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "rgba(242,238,232,0.78)", marginTop: 12, lineHeight: 1.55, fontWeight: 300 }}>{s.sub}</p>
                <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sky)" }}>
                  <span className="e-mono">{s.cta}</span>
                  <Icon name="arrowUpRight" size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* THE AVATARS */}
      <section style={{ padding: "60px 22px", background: "var(--bone)", color: "var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>03 / MEET THE AVATARS</div>
          <h2 className="e-display" style={{ fontSize: "clamp(40px, 7vw, 60px)", marginTop: 14, lineHeight: 0.95 }}>YOUR AI COACHES.</h2>
          <p style={{ marginTop: 14, color: "rgba(10,14,20,0.65)", maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
            Three avatars, three styles. Modeled on real Element 78 trainers, trained on thousands of hours of cueing.
          </p>
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {avatars.map(a => (
              <div key={a.name} className="lift" style={{ borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", border: "1px solid rgba(10,14,20,0.06)" }}>
                <div style={{ position: "relative", aspectRatio: "0.92" }}>
                  <Photo src={a.img} alt={a.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(10,14,20,0.95) 100%)" }} />
                  <div style={{ position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(10,14,20,0.55)", backdropFilter: "blur(10px)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sky)" }} />
                    <span className="e-mono" style={{ fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em" }}>AI AVATAR</span>
                  </div>
                  <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                    <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95, letterSpacing: "0.02em" }}>{a.name}</div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, marginTop: 6, letterSpacing: "0.18em" }}>{a.spec.toUpperCase()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "84px 22px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(44px, 8vw, 72px)", marginTop: 14, lineHeight: 0.92 }}>FIRST SESSION<br/>ON US.</h2>
          <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, marginTop: 18, color: "rgba(242,238,232,0.78)" }}>
            Open the app. Press play. Hold the squeeze.
          </p>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>START FREE</Link>
            <Link href="/programs" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>BROWSE PROGRAMS</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
