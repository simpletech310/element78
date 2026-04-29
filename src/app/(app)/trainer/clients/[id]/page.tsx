import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerClientHistory, listProfilesByIds } from "@/lib/data/queries";

export default async function TrainerClientDetailPage({ params }: { params: { id: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect(`/login?next=/trainer/clients/${params.id}`);

  const [history, profiles] = await Promise.all([
    listTrainerClientHistory(trainer.id, params.id),
    listProfilesByIds([params.id]),
  ]);
  const profile = profiles[params.id] ?? { display_name: "Member", avatar_url: null, handle: null };

  const totalInteractions = history.bookings.length + history.classBookings.length + history.enrollments.length;
  if (totalInteractions === 0) {
    redirect("/trainer/clients?error=no_history");
  }

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/clients" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>YOUR CLIENTS</span>
        </Link>

        <div style={{ marginTop: 18, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
            {profile.avatar_url ? (
              <Photo src={profile.avatar_url} alt={profile.display_name ?? "Client"} style={{ width: "100%", height: "100%" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                <Icon name="user" size={32} />
              </div>
            )}
          </div>
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>CLIENT</div>
            <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 0.95, marginTop: 6 }}>
              {(profile.display_name ?? "Member").toUpperCase()}
            </h1>
            <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>
              TOTAL · ${(history.totalSpentCents / 100).toFixed(0)} SPENT
            </div>
          </div>
        </div>

        {/* PROGRAMS */}
        <Section title={`PROGRAMS · ${history.enrollments.length}`}>
          {history.enrollments.length === 0 ? <Empty body="Not enrolled in any of your programs." /> : (
            history.enrollments.map(({ enrollment, program, completionCount }) => {
              const pct = program.total_sessions > 0 ? Math.min(100, Math.round((completionCount / program.total_sessions) * 100)) : 0;
              return (
                <Link key={enrollment.id} href={`/trainer/programs/${program.id}`} className="lift" style={{
                  display: "block", padding: 14, borderRadius: 14,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{program.name.toUpperCase()}</div>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>
                      {enrollment.status.toUpperCase()} · DAY {enrollment.current_day}/{program.total_sessions}
                    </div>
                  </div>
                  <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)" }} />
                  </div>
                  <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em" }}>
                    {completionCount} OF {program.total_sessions} COMPLETED · STARTED {new Date(enrollment.started_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}
                  </div>
                </Link>
              );
            })
          )}
        </Section>

        {/* 1-ON-1 SESSIONS */}
        <Section title={`1-ON-1 SESSIONS · ${history.bookings.length}`}>
          {history.bookings.length === 0 ? <Empty body="No 1-on-1 sessions with you." /> : (
            history.bookings.map(b => {
              const dt = new Date(b.starts_at);
              return (
                <div key={b.id} style={{
                  padding: 12, borderRadius: 12,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>
                      {dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase()} · {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      · {b.mode.replace("_", " ").toUpperCase()}
                    </div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>
                      {b.status.replace(/_/g, " ").toUpperCase()} · {b.paid_status.toUpperCase()}
                    </div>
                  </div>
                  {b.client_goals && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.8)", lineHeight: 1.5 }}>"{b.client_goals}"</div>
                  )}
                  {b.trainer_notes && (
                    <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.14em" }}>
                      NOTES: {b.trainer_notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Section>

        {/* CLASSES */}
        <Section title={`CLASSES · ${history.classBookings.length}`}>
          {history.classBookings.length === 0 ? <Empty body="No classes with you." /> : (
            history.classBookings.map(({ booking, class: cls }) => {
              const dt = new Date(cls.starts_at);
              return (
                <div key={booking.id} style={{
                  padding: 12, borderRadius: 12,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6,
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{cls.name.toUpperCase()}</div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}>
                      {dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()} · {dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>
                    {booking.status.toUpperCase()} · {booking.paid_status.toUpperCase()}
                  </div>
                </div>
              );
            })
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>{title}</div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>{body}</div>
  );
}
