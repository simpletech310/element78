import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { listClasses, listUserEnrollments, listUserBookings, listEnrollmentCompletions } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default async function HomeScreen() {
  const [classes, user] = await Promise.all([listClasses(), getUser()]);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined)
    ?? (user?.email?.split("@")[0])
    ?? "MEMBER";
  const firstName = displayName.split(/\s+/)[0];

  // Pull the user's active programs + upcoming bookings — drives the
  // personalized strips below the daily ritual.
  const [enrollments, bookings] = user
    ? await Promise.all([listUserEnrollments(user.id), listUserBookings(user.id)])
    : [[], []];
  const activePrograms = enrollments.filter(e => e.enrollment.status === "active");
  const completedCounts: Record<string, number> = {};
  await Promise.all(activePrograms.map(async ({ enrollment }) => {
    const cs = await listEnrollmentCompletions(enrollment.id);
    completedCounts[enrollment.id] = cs.length;
  }));

  const now = Date.now();
  const upcomingBookings = bookings
    .filter(b => b.booking.status === "reserved" && new Date(b.class.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.class.starts_at).getTime() - new Date(b.class.starts_at).getTime());

  // Next-up class on the gym strip — prefer the user's first booking, fall back to schedule.
  const next = upcomingBookings[0]?.class ?? classes[0];
  const dt = next ? new Date(next.starts_at) : null;
  const dayLabel = dt?.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = dt?.getDate();
  const time = dt?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase();

  const studio = [
    { t: "GLUTE BRIDGE FLOW", mins: 18, lvl: "LO", img: "/assets/IMG_3467.jpg", tag: "PILATES" },
    { t: "STREET HIIT", mins: 24, lvl: "HI", img: "/assets/IMG_3465.jpg", tag: "HIIT" },
    { t: "CORE 78", mins: 30, lvl: "MD", img: "/assets/floor-mockup.png", tag: "CORE" },
  ];

  const pulse = [
    { name: "AALIYAH M.", act: "finished CORE 78", time: "2m", img: "/assets/editorial-1.jpg", tag: false },
    { name: "KAI · TRAINER", act: "dropped a new flow", time: "14m", img: "/assets/blue-hair-gym.jpg", tag: true },
  ];

  return (
    <div className="app app-dark" style={{ height: "100dvh" }}>
      <StatusBar dark />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()} / {(new Date().getMonth()+1).toString().padStart(2,"0")}.{new Date().getDate().toString().padStart(2,"0")} / ATL
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 0.95, marginTop: 6, letterSpacing: "0.02em" }}>
              {greeting()},<br/><span style={{ color: "var(--sky)" }}>{firstName.toUpperCase()}.</span>
            </div>
          </div>
          <Link href="/account" aria-label="Account" style={{ position: "relative", display: "block" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--sky)" }}>
              <Photo src="/assets/blue-hair-selfie.jpg" alt="profile" style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ position: "absolute", bottom: -2, right: -2, background: "var(--electric)", color: "var(--ink)", borderRadius: 999, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, border: "2px solid var(--ink)" }}>14</div>
          </Link>
        </div>

        {/* Hero — today's ritual */}
        <div style={{ padding: "0 22px" }}>
          <Link href="/train/player" className="lift" style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 380, background: "#000", display: "block", color: "var(--bone)", textDecoration: "none" }}>
            <Photo src="/assets/IMG_3467.jpg" alt="glute bridge flow" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.85 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.1) 30%, rgba(10,14,20,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999, color: "var(--sky)" }}>◉ TODAY&apos;S RITUAL</div>
              <div className="e-tag" style={{ background: "rgba(10,14,20,0.7)", backdropFilter: "blur(12px)", padding: "6px 10px", borderRadius: 999 }}>42 MIN</div>
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>SERIES 03 · DAY 14</div>
              <div className="e-display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                LOW-IMPACT<br/>
                <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", textTransform: "none", letterSpacing: 0 }}>power</span> PILATES
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <span className="btn btn-sky" style={{ flex: 1 }}><Icon name="play" size={14} />BEGIN</span>
                <span className="btn btn-ghost" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--bone)" }}>PREVIEW</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Streak ribbon */}
        <div style={{ padding: "20px 22px 6px", display: "flex", justifyContent: "space-between", gap: 10 }}>
          {[{ k: "14", l: "DAY STREAK" }, { k: "03:42", l: "WK ACTIVE" }, { k: "78%", l: "WEEKLY GOAL" }].map((s) => (
            <div key={s.l} style={{ flex: 1, padding: "14px 12px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--sky)", letterSpacing: "0.02em" }}>{s.k}</div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* YOUR PROGRAMS — only when enrolled */}
        {activePrograms.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR PROGRAMS</div>
              <Link href="/account/history" className="e-mono" style={{ color: "var(--sky)" }}>HISTORY →</Link>
            </div>
            <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
              {activePrograms.map(({ enrollment, program }) => {
                const c = completedCounts[enrollment.id] ?? 0;
                const pct = Math.round((c / Math.max(1, program.total_sessions)) * 100);
                return (
                  <Link key={enrollment.id} href={`/programs/${program.slug}`} className="lift" style={{
                    minWidth: 260, flexShrink: 0,
                    borderRadius: 16, overflow: "hidden",
                    background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.05))",
                    border: "1px solid rgba(143,184,214,0.3)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ position: "relative", height: 140 }}>
                      {program.hero_image && <Photo src={program.hero_image} alt="" style={{ position: "absolute", inset: 0 }} />}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.85))" }} />
                      <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 999, background: "var(--sky)", color: "var(--ink)" }} className="e-mono" >IN PROGRESS</div>
                      <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                        <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.18em" }}>{program.duration_label}</div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95, marginTop: 4 }}>{program.name}</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ height: 4, background: "rgba(143,184,214,0.18)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 6px rgba(143,184,214,0.55)" }} />
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
                        DAY {enrollment.current_day}/{program.total_sessions} · {pct}%
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* YOUR UPCOMING CLASSES — only when reserved */}
        {upcomingBookings.length > 0 && (
          <>
            <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="e-display" style={{ fontSize: 22 }}>YOUR CLASSES</div>
              <Link href="/gym" className="e-mono" style={{ color: "var(--sky)" }}>ALL BOOKED →</Link>
            </div>
            <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingBookings.slice(0, 3).map(({ booking, class: cls }) => {
                const dt2 = new Date(cls.starts_at);
                const dStr = dt2.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const tStr = dt2.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const priceLabel = booking.paid_status === "free" ? "FREE"
                                : booking.paid_status === "paid" ? `PAID · $${(booking.price_cents_paid/100).toFixed(0)}`
                                : `PAY AT CHECK-IN · $${(booking.price_cents_paid/100).toFixed(0)}`;
                return (
                  <Link key={booking.id} href={`/gym/classes/${cls.id}`} className="lift" style={{
                    display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                    padding: "14px 16px", borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(143,184,214,0.12), rgba(77,169,214,0.04))",
                    border: "1px solid rgba(143,184,214,0.28)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.2)" }}>
                      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{dStr}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 2 }}>{tStr}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, letterSpacing: "0.02em" }}>{cls.name}</div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, marginTop: 4, letterSpacing: "0.18em" }}>
                        {cls.kind?.toUpperCase()} · {cls.room ?? ""} · SPOT {booking.spot_number ?? "—"}
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em" }}>{priceLabel}</div>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* AI Studio rail */}
        <div style={{ padding: "28px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>AI STUDIO</div>
          <Link href="/train" className="e-mono" style={{ color: "var(--sky)" }}>SEE ALL →</Link>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 12, padding: "0 22px", overflowX: "auto" }}>
          {studio.map((c, i) => (
            <Link href="/train/player" key={i} className="lift" style={{ minWidth: 200, borderRadius: 16, overflow: "hidden", background: "var(--haze)", flexShrink: 0, color: "var(--bone)", textDecoration: "none" }}>
              <div style={{ position: "relative", height: 220 }}>
                <Photo src={c.img} alt={c.t} style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)" }} />
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span className="e-tag" style={{ background: "rgba(10,14,20,0.65)", backdropFilter: "blur(8px)", padding: "4px 8px", borderRadius: 4, color: "var(--sky)" }}>{c.tag}</span>
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "var(--electric)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={12} />
                </div>
                <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 0.95 }}>{c.t}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", marginTop: 4, fontSize: 9 }}>{c.mins} MIN · {c.lvl} INTENSITY</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Next at the gym */}
        {next && (
          <div style={{ padding: "28px 22px 12px" }}>
            <div className="e-display" style={{ fontSize: 22, marginBottom: 12 }}>NEXT AT THE GYM</div>
            <Link href={`/gym/classes/${next.id}`} style={{ borderRadius: 16, padding: 16, background: "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(77,169,214,0.05))", border: "1px solid rgba(143,184,214,0.25)", display: "flex", gap: 14, color: "var(--bone)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "12px 0", borderRight: "1px solid rgba(143,184,214,0.2)", paddingRight: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9 }}>{dayLabel}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 1, marginTop: 2 }}>{dayNum}</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 2 }}>{time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 4 }}>{next.kind?.toUpperCase()} · {next.room}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}>{next.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ display: "flex" }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: ["var(--sky)","var(--rose)","var(--electric)"][i], marginLeft: i ? -6 : 0, border: "2px solid var(--ink)" }} />
                    ))}
                  </div>
                  <span className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 10 }}>+{next.booked} BOOKED · WITH KAI</span>
                </div>
              </div>
              <Icon name="chevron" size={20} />
            </Link>
          </div>
        )}

        {/* Crew pulse */}
        <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Link href="/wall" className="e-display" style={{ fontSize: 22, color: "var(--bone)", textDecoration: "none" }}>THE WALL</Link>
          <Link href="/wall" className="e-mono" style={{ color: "rgba(242,238,232,0.5)" }}>LIVE · 78 →</Link>
        </div>
        <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {pulse.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: "var(--haze)", borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Photo src={p.img} alt={p.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{p.name}</span>
                  {p.tag && <span className="e-mono" style={{ background: "var(--sky)", color: "var(--ink)", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>STAFF</span>}
                </div>
                <div style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", marginTop: 2 }}>{p.act}</div>
              </div>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.4)", fontSize: 9 }}>{p.time}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator dark />
    </div>
  );
}
