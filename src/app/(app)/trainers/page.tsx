import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listTrainers } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

const aiAvatars = [
  { slug: "zuri", name: "ZURI", spec: "Pilates · Reformer · Mobility", img: "/assets/blue-hair-gym.jpg", note: "Slow tempo, hard work. Modeled on Kai's signature flow." },
  { slug: "mari", name: "MARI", spec: "HIIT · Functional · Conditioning", img: "/assets/dumbbell-street.jpg", note: "Heavy basics, quick rounds. Modeled on Amara." },
  { slug: "leila", name: "LEILA", spec: "Yoga · Breathwork · Recovery", img: "/assets/pilates-pink.jpg", note: "Breath-led restorative flows. Modeled on Simone." },
];

export default async function TrainersPage() {
  const [trainers, user] = await Promise.all([listTrainers(), getUser()]);
  const isAuthed = !!user;
  const featured = trainers[0];
  const rest = trainers.slice(1);
  const filters = [{ l: "ALL", a: true }, { l: "PILATES" }, { l: "STRENGTH" }, { l: "YOGA" }, { l: "HIIT" }, { l: "1-ON-1" }, { l: "AI AVATARS" }];

  const body = (
    <>
      {/* HERO */}
      <section style={{ position: "relative", padding: "60px 22px 28px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono reveal" style={{ color: "var(--sky)" }}>FAMILY · {trainers.length + aiAvatars.length} COACHES · HUMAN + AI</div>
        <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(48px, 11vw, 104px)", marginTop: 14, lineHeight: 0.92 }}>
          THE TEAM.
        </h1>
        <p className="reveal reveal-d2" style={{ marginTop: 18, fontSize: 16, color: "rgba(242,238,232,0.7)", maxWidth: 540, lineHeight: 1.6 }}>
          Six certified trainers on the Atlanta floor. Three AI avatars in your phone. Same standard, same cues, all available to every member.
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
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 12, letterSpacing: "0.2em" }}>★ FEATURED · HUMAN</div>
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
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", marginBottom: 12, letterSpacing: "0.2em" }}>HUMAN TRAINERS · ATLANTA</div>
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

      {/* AI AVATARS */}
      <section style={{ padding: "44px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", letterSpacing: "0.2em" }}>AI AVATARS · IN-APP + IN-GYM</div>
          <Link href="/ai-sessions" className="e-mono" style={{ color: "var(--sky)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            HOW THE AI WORKS <Icon name="arrowUpRight" size={14} />
          </Link>
        </div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {aiAvatars.map(a => (
            <div key={a.slug} className="lift" style={{ borderRadius: 18, overflow: "hidden", background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
              <div style={{ position: "relative", aspectRatio: "0.82" }}>
                <Photo src={a.img} alt={a.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(10,14,20,0.95) 100%)" }} />
                <div style={{ position: "absolute", top: 14, left: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: "rgba(10,14,20,0.7)", backdropFilter: "blur(10px)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sky)" }} />
                  <span className="e-mono" style={{ fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em" }}>AI AVATAR</span>
                </div>
                <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                  <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95, letterSpacing: "0.02em" }}>{a.name}</div>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, marginTop: 6, letterSpacing: "0.18em" }}>{a.spec.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <p style={{ fontSize: 12.5, color: "rgba(242,238,232,0.7)", lineHeight: 1.55 }}>{a.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  // Authed → in-app shell with TabBar
  if (isAuthed) {
    return (
      <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
        <div className="app-scroll" style={{ paddingBottom: 30 }}>{body}</div>
        <TabBar />
      </div>
    );
  }

  // Public → marketing layout
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={false} />
      {body}
      <SiteFooter />
    </div>
  );
}
