import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listTrainers } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

export default async function TrainersPage() {
  const [allTrainers, user] = await Promise.all([listTrainers(), getUser()]);
  const isAuthed = !!user;
  // Every coach in the directory is a real bookable human now — no AI
  // avatars on this page. (Studio routines still get rendered via their own
  // path in /train.)
  const trainers = allTrainers.filter(t => !t.is_ai);
  const featured = trainers[0];
  const rest = trainers.slice(1);
  const filters = [{ l: "ALL", a: true }, { l: "PILATES" }, { l: "STRENGTH" }, { l: "YOGA" }, { l: "HIIT" }, { l: "1-ON-1" }, { l: "STUDIO" }];

  const body = (
    <>
      {/* HERO */}
      <section style={{ position: "relative", padding: "60px 22px 28px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono reveal" style={{ color: "var(--sky)" }}>COACH DIRECTORY · {trainers.length} ACTIVE</div>
        <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(48px, 11vw, 104px)", marginTop: 14, lineHeight: 0.92 }}>
          BOOK A COACH.
        </h1>
        <p className="reveal reveal-d2" style={{ marginTop: 18, fontSize: 16, color: "rgba(242,238,232,0.7)", maxWidth: 560, lineHeight: 1.6 }}>
          Real people, on the floor and on your screen. 1-on-1 video sessions, in-person privates, group sessions, classes — pick the coach, pick the time. Members book in two taps; non-members can browse and join when you&rsquo;re ready.
        </p>
      </section>

      {/* FILTERS */}
      <section style={{ padding: "8px 22px 4px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.a ? "var(--sky)" : "rgba(143,184,214,0.06)",
              color: c.a ? "var(--ink)" : "var(--bone)",
              border: c.a ? "none" : "1px solid rgba(143,184,214,0.22)",
              whiteSpace: "nowrap", cursor: "pointer",
            }}>{c.l}</div>
          ))}
        </div>
      </section>

      {/* HUMAN — featured */}
      {featured && (
        <section style={{ padding: "24px 22px 0", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 12, letterSpacing: "0.2em" }}>★ FEATURED COACH</div>
          <Link href={`/trainers/${featured.slug}`} className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", minHeight: 360, display: "block", color: "var(--bone)", textDecoration: "none", border: "1px solid rgba(143,184,214,0.12)" }}>
            <Photo src={featured.hero_image ?? ""} alt={featured.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
              <div className="e-mono" style={{ color: "var(--sky)" }}>{featured.specialties[0]?.toUpperCase()} · ATLANTA HQ</div>
              <div className="e-display" style={{ fontSize: "clamp(40px, 6vw, 56px)", lineHeight: 0.95, marginTop: 8 }}>{featured.name.toUpperCase()}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center" }} className="e-mono">
                <span style={{ color: "var(--sky)" }}>★ {featured.rating}</span>
                <span style={{ opacity: 0.6 }}>14 FLOWS</span>
                <span className="btn btn-sky" style={{ marginLeft: "auto", padding: "10px 18px", fontSize: 10 }}>VIEW PROFILE</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* HUMAN trainers list */}
      <section style={{ padding: "32px 22px 4px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 12, letterSpacing: "0.2em" }}>COACHES · ATLANTA</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {rest.map(t => (
            <Link key={t.id} href={`/trainers/${t.slug}`} className="lift" style={{ display: "flex", gap: 14, padding: 14, borderRadius: 16, background: "rgba(143,184,214,0.05)", border: "1px solid rgba(143,184,214,0.18)", color: "var(--bone)", textDecoration: "none" }}>
              <div style={{ width: 76, height: 96, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <Photo src={t.avatar_url ?? t.hero_image ?? ""} alt={t.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>{t.name.toUpperCase()}</div>
                  <span className="e-mono" style={{ color: "var(--sky)" }}>★ {t.rating}</span>
                </div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 6, letterSpacing: "0.18em" }}>{t.specialties.slice(0, 2).join(" · ").toUpperCase()}</div>
                <p style={{ fontSize: 12, color: "rgba(242,238,232,0.7)", marginTop: 8, lineHeight: 1.5 }}>{t.headline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BECOME A COACH — apply to join the network. Lives in the same
          slot the AI avatars used to occupy so the page rhythm holds. */}
      <section style={{ padding: "60px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            position: "relative",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(143,184,214,0.32)",
            background: "linear-gradient(135deg, rgba(46,127,176,0.22), rgba(10,14,20,0.95))",
            padding: "44px 32px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.28em", fontSize: 11 }}>
              ◉ COACHES WANTED
            </div>
            <h2 className="e-display" style={{ fontSize: "clamp(32px, 5.5vw, 48px)", lineHeight: 0.95, marginTop: 12 }}>
              TRAIN PEOPLE.<br/>GET PAID FOR IT.
            </h2>
            <p style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.78)", lineHeight: 1.6, maxWidth: 540, fontWeight: 300 }}>
              Apply to join the Element 78 coaching network. Set your own price, your own hours, your own programs. We handle the booking flow, payments, and the tech — Daily for the call, Stripe for the payout. You bring the work.
            </p>
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/coach/apply" className="btn btn-sky" style={{ padding: "13px 24px" }}>
                APPLY TO COACH →
              </Link>
              <Link href="/faq#real-coaches" className="e-mono" style={{ alignSelf: "center", color: "rgba(242,238,232,0.7)", fontSize: 11, letterSpacing: "0.2em", textDecoration: "none", borderBottom: "1px solid rgba(242,238,232,0.25)", paddingBottom: 4 }}>
                HOW IT WORKS
              </Link>
            </div>
          </div>
          <div className="e-mono" style={{ display: "grid", gap: 10, color: "rgba(242,238,232,0.85)", fontSize: 12, letterSpacing: "0.16em", alignSelf: "stretch", borderLeft: "1px solid rgba(143,184,214,0.25)", paddingLeft: 22 }}>
            <PerkLine label="SET YOUR RATE" sub="$30 – $300+ / session" />
            <PerkLine label="OWN YOUR SCHEDULE" sub="Hour blocks · 30-min slots" />
            <PerkLine label="KEEP MOST OF IT" sub="Stripe payout to you direct" />
            <PerkLine label="GROW YOUR LIST" sub="Programs · groups · 1-on-1" />
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={isAuthed} />
      {body}
      <SiteFooter />
      {isAuthed && <FloatingTabBar />}
    </div>
  );
}

function PerkLine({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <div style={{ color: "var(--sky)" }}>{label}</div>
      <div style={{ marginTop: 4, color: "rgba(242,238,232,0.65)", fontSize: 10, letterSpacing: "0.14em" }}>{sub}</div>
    </div>
  );
}
