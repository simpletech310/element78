import Link from "next/link";
import { redirect } from "next/navigation";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { listUserEnrollments, listEnrollmentCompletions, listUserBookings } from "@/lib/data/queries";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/history");

  const [enrollments, bookings] = await Promise.all([
    listUserEnrollments(user.id),
    listUserBookings(user.id),
  ]);
  const active = enrollments.filter(e => e.enrollment.status === "active");
  const done = enrollments.filter(e => e.enrollment.status === "completed");
  const paused = enrollments.filter(e => e.enrollment.status === "paused" || e.enrollment.status === "left");

  const now = Date.now();
  const upcoming = bookings.filter(b => b.booking.status === "reserved" && new Date(b.class.starts_at).getTime() >= now);
  const past = bookings.filter(b => new Date(b.class.starts_at).getTime() < now);

  // Aggregate completion counts per enrollment for the active section
  const completionCounts = new Map<string, number>();
  await Promise.all(active.map(async ({ enrollment }) => {
    const cs = await listEnrollmentCompletions(enrollment.id);
    completionCounts.set(enrollment.id, cs.length);
  }));

  const totalSessionsCompleted = Array.from(completionCounts.values()).reduce((n, x) => n + x, 0);

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
          </Link>
        </div>

        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR · RECORD</div>
          <h1 className="e-display" style={{ fontSize: "clamp(40px, 9vw, 64px)", lineHeight: 0.92, marginTop: 12 }}>HISTORY.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 480, lineHeight: 1.6 }}>
            Every program you&apos;ve enrolled in. Every session you&apos;ve closed out.
          </p>

          {/* Roll-up tile */}
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
            <RollUp label="ACTIVE" v={String(active.length)} />
            <RollUp label="COMPLETED" v={String(done.length)} />
            <RollUp label="SESSIONS" v={String(totalSessionsCompleted)} />
            <RollUp label="UPCOMING" v={String(upcoming.length)} />
          </div>
        </section>

        {/* UPCOMING CLASS RESERVATIONS */}
        {upcoming.length > 0 && (
          <section style={{ padding: "28px 22px 0" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>UPCOMING CLASSES</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map(({ booking, class: cls }) => {
                const dt = new Date(cls.starts_at);
                const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const priceLabel = booking.paid_status === "free" ? "FREE"
                                : booking.paid_status === "paid" ? `PAID · $${(booking.price_cents_paid/100).toFixed(0)}`
                                : `PAY AT CHECK-IN · $${(booking.price_cents_paid/100).toFixed(0)}`;
                return (
                  <Link key={booking.id} href={`/classes/${cls.id}`} className="lift" style={{
                    display: "flex", gap: 14, padding: 14, borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(46,127,176,0.04))",
                    border: "1px solid rgba(143,184,214,0.28)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ minWidth: 64, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.2)" }}>
                      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{dateStr}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>{cls.name}</div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
                        {cls.kind?.toUpperCase() ?? "CLASS"} · {cls.room ?? ""} · {cls.duration_min}M
                      </div>
                      <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: "var(--sky)", letterSpacing: "0.2em" }}>
                        {priceLabel}
                      </div>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ACTIVE */}
        <section style={{ padding: "32px 22px 4px" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>01 / IN PROGRESS</div>
          {active.length === 0 ? (
            <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              Nothing in progress. <Link href="/programs" className="e-mono" style={{ color: "var(--sky)", marginLeft: 6 }}>BROWSE PROGRAMS →</Link>
            </div>
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              {active.map(({ enrollment, program }) => {
                const c = completionCounts.get(enrollment.id) ?? 0;
                const pct = Math.round((c / Math.max(1, program.total_sessions)) * 100);
                return (
                  <Link key={enrollment.id} href={`/programs/${program.slug}`} className="lift" style={{
                    display: "flex", gap: 14, padding: 14, borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.05))",
                    border: "1px solid rgba(143,184,214,0.3)",
                    color: "var(--bone)", textDecoration: "none",
                  }}>
                    <div style={{ width: 56, height: 72, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "var(--haze)" }}>
                      {program.hero_image && <Photo src={program.hero_image} alt="" style={{ width: "100%", height: "100%" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{program.duration_label}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 4, letterSpacing: "0.02em" }}>{program.name}</div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(143,184,214,0.18)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 6px rgba(143,184,214,0.6)" }} />
                      </div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
                        DAY {enrollment.current_day}/{program.total_sessions} · {pct}% · STARTED {new Date(enrollment.started_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Icon name="chevron" size={18} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* COMPLETED */}
        {done.length > 0 && (
          <section style={{ padding: "28px 22px 4px" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>02 / COMPLETED</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {done.map(({ enrollment, program }) => (
                <Link key={enrollment.id} href={`/programs/${program.slug}`} style={{
                  display: "flex", gap: 14, padding: 12, borderRadius: 14,
                  background: "var(--haze)", border: "1px solid rgba(255,255,255,0.05)",
                  color: "var(--bone)", textDecoration: "none",
                }}>
                  <div style={{ width: 44, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--haze-2)" }}>
                    {program.hero_image && <Photo src={program.hero_image} alt="" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: "0.02em" }}>{program.name}</span>
                      <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>✓ DONE</span>
                    </div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}>
                      {program.total_sessions} SESSIONS · COMPLETED {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Icon name="chevron" size={18} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* PAST CLASSES */}
        {past.length > 0 && (
          <section style={{ padding: "28px 22px 0" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em", fontSize: 10 }}>PAST CLASSES</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {past.slice(0, 8).map(({ booking, class: cls }) => {
                const dt = new Date(cls.starts_at);
                const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
                return (
                  <Link key={booking.id} href={`/classes/${cls.id}`} style={{
                    display: "flex", gap: 12, padding: 12, borderRadius: 12,
                    background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)",
                    color: "var(--bone)", textDecoration: "none",
                    opacity: booking.status === "cancelled" ? 0.5 : 1,
                  }}>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.18em", minWidth: 50 }}>{dateStr}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{cls.name}</div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.18em", marginTop: 3 }}>
                        {booking.status === "cancelled" ? "CANCELLED" : "ATTENDED"} · {booking.paid_status.toUpperCase()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* PAUSED / LEFT */}
        {paused.length > 0 && (
          <section style={{ padding: "28px 22px 0" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em", fontSize: 10 }}>03 / PAUSED</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {paused.map(({ enrollment, program }) => (
                <Link key={enrollment.id} href={`/programs/${program.slug}`} style={{
                  display: "flex", gap: 12, padding: 12, borderRadius: 14,
                  background: "transparent", border: "1px dashed rgba(143,184,214,0.25)",
                  color: "var(--bone)", textDecoration: "none",
                  opacity: 0.85,
                }}>
                  <div style={{ width: 38, height: 50, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--haze-2)" }}>
                    {program.hero_image && <Photo src={program.hero_image} alt="" style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.02em" }}>{program.name}</div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}>
                      LEFT AT DAY {enrollment.current_day}/{program.total_sessions} — TAP TO RESUME
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function RollUp({ label, v }: { label: string; v: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--sky)", lineHeight: 1 }}>{v}</div>
      <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", marginTop: 6, letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}
