import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getTrainer } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

export default async function TrainerProfile({ params }: { params: { slug: string } }) {
  const [t, user] = await Promise.all([getTrainer(params.slug), getUser()]);
  if (!t) notFound();
  const isAuthed = !!user;

  const flows = [
    { t: "WEST COAST FLOW", m: 28, img: "/assets/blue-set-rooftop.jpg" },
    { t: "STREET STRENGTH", m: 35, img: "/assets/dumbbell-street.jpg" },
    { t: "CORE 78", m: 22, img: "/assets/bridge-pose.jpg" },
  ];
  const slots = [
    { d: "WED 04.29", t: "6:30P · WEST COAST FLOW · STUDIO B", spots: 6 },
    { d: "FRI 05.01", t: "7:00A · CORE 78 · STUDIO A", spots: 2 },
    { d: "SAT 05.02", t: "10:00A · OUTDOOR HIIT · ROOF", spots: 11 },
  ];

  const body = (
    <div style={{ paddingBottom: 60 }}>
        <div style={{ position: "relative", height: 480 }}>
          <Photo src={t.hero_image ?? ""} alt={t.name} style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.6) 0%, rgba(10,14,20,0.05) 30%, rgba(10,14,20,0.05) 60%, rgba(10,14,20,1) 100%)" }} />

          <div style={{ position: "absolute", top: 50, left: 22, right: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/trainers" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={18} /></button>
              <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrowUpRight" size={16} /></button>
            </div>
          </div>

          <div style={{ position: "absolute", left: 22, right: 22, bottom: 16, color: "var(--bone)" }}>
            <div className="e-mono" style={{ color: "var(--sky)" }}>TRAINER · ATLANTA</div>
            <div className="e-display" style={{ fontSize: 56, lineHeight: 0.9, marginTop: 4 }}>
              {t.name.split(" ")[0].toUpperCase()}<br/>{t.name.split(" ").slice(1).join(" ").toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)" }}>{t.rating}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>RATING · 412</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>9 YR</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>EXPERIENCE</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>1.2K</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>FOLLOWERS</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 8 }}>SPECIALTIES</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {t.specialties.map(s => (
              <span key={s} className="e-tag" style={{ padding: "6px 11px", borderRadius: 999, border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)" }}>{s.toUpperCase()}</span>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>BIO</div>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: "rgba(242,238,232,0.85)" }}>{t.bio}</div>
        </div>

        <div style={{ padding: "12px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>FLOWS</div>
          <div className="e-mono" style={{ color: "var(--sky)" }}>{flows.length}</div>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 10, padding: "12px 22px 0", overflowX: "auto" }}>
          {flows.map((w, i) => (
            <div key={i} style={{ minWidth: 160, flexShrink: 0, borderRadius: 12, overflow: "hidden", position: "relative", height: 200 }}>
              <Photo src={w.img} alt={w.t} style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(10,14,20,0.85))" }} />
              <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, color: "var(--bone)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 0.95 }}>{w.t}</div>
                <div className="e-mono" style={{ fontSize: 8, color: "rgba(242,238,232,0.6)", marginTop: 3 }}>{w.m} MIN</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", marginBottom: 10 }}>NEXT AT GYM</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {slots.map((b, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(143,184,214,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                <div className="e-mono" style={{ color: "var(--sky)", minWidth: 70, fontSize: 10 }}>{b.d}</div>
                <div style={{ flex: 1, fontSize: 12, color: "rgba(242,238,232,0.85)" }}>{b.t}</div>
                <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)" }}>{b.spots} LEFT</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 40px", display: "flex", gap: 8 }}>
          <Link href={isAuthed ? "/gym" : "/join"} className="btn btn-sky" style={{ flex: 1 }}>BOOK 1-ON-1</Link>
          <Link href="/contact" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "var(--bone)", border: "1px solid rgba(255,255,255,0.2)" }}>MESSAGE</Link>
        </div>
    </div>
  );

  if (isAuthed) {
    return (
      <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
        <div className="app-scroll" style={{ paddingBottom: 30 }}>{body}</div>
        <TabBar />
      </div>
    );
  }
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={false} />
      {body}
      <SiteFooter />
    </div>
  );
}
