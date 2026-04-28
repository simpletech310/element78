import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listClasses, listTrainers } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default async function ClassesPage() {
  const [classes, trainers, user] = await Promise.all([listClasses(), listTrainers(), getUser()]);
  const trainerMap = new Map(trainers.map(t => [t.id, t]));

  // Group classes by day for the next 7 days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { d: Date; classes: typeof classes }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const next = new Date(d.getTime() + 86400000);
    days.push({
      d,
      classes: classes
        .filter(c => {
          const t = new Date(c.starts_at);
          return t >= d && t < next;
        })
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    });
  }

  const totalThisWeek = days.reduce((n, day) => n + day.classes.length, 0);

  const filters = [{ l: `ALL · ${totalThisWeek}`, a: true }, { l: "REFORMER" }, { l: "PILATES" }, { l: "HIIT" }, { l: "YOGA" }, { l: "OPEN SPOT" }];

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={!!user} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 480 }}>
        <Photo src="/assets/blue-hair-gym.jpg" alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.55, backgroundPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "60px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div className="e-mono reveal" style={{ color: "var(--sky)" }}>◉ THIS WEEK · ATLANTA HQ</div>
          <h1 className="e-display reveal reveal-d1" style={{ fontSize: "clamp(56px, 12vw, 112px)", marginTop: 18, lineHeight: 0.9 }}>
            LIVE<br/>CLASSES.
          </h1>
          <p className="reveal reveal-d2" style={{ marginTop: 22, fontSize: "clamp(20px, 3.4vw, 26px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 520 }}>
            Pull up. Take the floor. Leave better.
          </p>
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.7)", maxWidth: 520, lineHeight: 1.6 }}>
            {totalThisWeek} classes on the schedule this week — reformer, mat Pilates, HIIT, yoga, and mobility. Members reserve in-app, day-pass guests sign up at the desk.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section style={{ padding: "32px 22px 8px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer",
              background: c.a ? "var(--sky)" : "rgba(143,184,214,0.06)",
              color: c.a ? "var(--ink)" : "var(--bone)",
              border: c.a ? "none" : "1px solid rgba(143,184,214,0.22)",
            }}>{c.l}</div>
          ))}
        </div>
      </section>

      {/* WEEKLY CALENDAR */}
      <section style={{ padding: "16px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {days.map(({ d, classes: dayClasses }, idx) => {
            const isToday = idx === 0;
            const dayLabel = d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
            const dateLabel = `${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
            return (
              <div key={dayKey(d)}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid rgba(143,184,214,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <div className="e-display" style={{ fontSize: 32, lineHeight: 1, color: isToday ? "var(--sky)" : "var(--bone)" }}>{dayLabel}</div>
                    {isToday && <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>· TODAY</span>}
                  </div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 11, letterSpacing: "0.2em" }}>{dateLabel} · {dayClasses.length}</div>
                </div>

                {dayClasses.length === 0 ? (
                  <div style={{ padding: "20px 0", color: "rgba(242,238,232,0.45)", fontSize: 13 }} className="e-mono">— REST DAY —</div>
                ) : (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    {dayClasses.map(c => {
                      const dt = new Date(c.starts_at);
                      const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                      const trainer = c.trainer_id ? trainerMap.get(c.trainer_id) : undefined;
                      const open = c.capacity - c.booked;
                      const full = open <= 0;
                      return (
                        <div key={c.id} className="lift" style={{
                          display: "grid",
                          gridTemplateColumns: "100px 1fr auto",
                          gap: 16,
                          alignItems: "center",
                          padding: "16px 20px",
                          borderRadius: 14,
                          background: "rgba(143,184,214,0.05)",
                          border: "1px solid rgba(143,184,214,0.18)",
                          opacity: full ? 0.6 : 1,
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}>{time}</div>
                            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 4, letterSpacing: "0.18em" }}>{c.duration_min} MIN</div>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{c.kind?.toUpperCase() ?? "CLASS"} · {c.room ?? ""}</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, marginTop: 5, letterSpacing: "0.02em" }}>{c.name}</div>
                            <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 5, letterSpacing: "0.18em" }}>
                              {trainer ? `WITH ${trainer.name.toUpperCase()}` : "TBD"} · {c.intensity ?? "MD"} · {full ? "WAITLIST" : `${open} SPOTS`}
                            </div>
                          </div>
                          <Link href={user ? `/gym/classes/${c.id}` : "/join"} className="btn" style={{
                            padding: "10px 16px", fontSize: 10,
                            background: full ? "transparent" : "var(--sky)",
                            color: full ? "var(--bone)" : "var(--ink)",
                            border: full ? "1px solid rgba(242,238,232,0.25)" : "none",
                          }}>{full ? "WAITLIST" : "RESERVE"}</Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>NOT A MEMBER YET?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(40px, 8vw, 64px)", marginTop: 14, lineHeight: 0.95 }}>RESERVE A SPOT.<br/>SEVEN DAYS FREE.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/join" className="btn btn-sky" style={{ minWidth: 200 }}>JOIN ELEMENT</Link>
            <Link href="/day-pass" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>OR GRAB A DAY PASS</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
