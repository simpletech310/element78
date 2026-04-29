import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerClientHistory, listProfilesByIds } from "@/lib/data/queries";
import { startThreadAction } from "@/lib/messaging-actions";
import { getActiveCoachClientNote } from "@/lib/coach-notes";
import { saveCoachClientNoteAction } from "@/lib/coach-notes-actions";
import { fmtDollars } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoachClientDetailPage({ params }: { params: { id: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect(`/login?next=/trainer/clients/${params.id}`);

  const [history, profiles, note] = await Promise.all([
    listTrainerClientHistory(coach.id, params.id),
    listProfilesByIds([params.id]),
    getActiveCoachClientNote(coach.id, params.id),
  ]);
  const profile = profiles[params.id] ?? { display_name: "Member", avatar_url: null, handle: null };

  const totalInteractions = history.bookings.length + history.classBookings.length + history.enrollments.length;
  if (totalInteractions === 0) {
    redirect("/trainer/clients?error=no_history");
  }

  return (
    <CoachShell coach={coach} pathname="/trainer/clients">
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
          {profile.avatar_url ? (
            <Photo src={profile.avatar_url} alt={profile.display_name ?? "Client"} style={{ width: "100%", height: "100%" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
              <Icon name="user" size={32} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>CLIENT</div>
          <h1 className="e-display" style={{ fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 0.95, marginTop: 8 }}>
            {(profile.display_name ?? "Member").toUpperCase()}
          </h1>
          <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.6)", fontSize: 10, letterSpacing: "0.2em" }}>
            TOTAL · {fmtDollars(history.totalSpentCents)} SPENT
          </div>
        </div>
        <form action={startThreadAction}>
          <input type="hidden" name="other_user_id" value={params.id} />
          <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>MESSAGE →</button>
        </form>
      </div>

        {/* COACH NOTES (private) */}
        <Section title="PRIVATE NOTES · COACH ONLY">
          <form action={saveCoachClientNoteAction} style={{ padding: 14, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <input type="hidden" name="client_user_id" value={params.id} />
            <textarea
              name="body"
              defaultValue={note?.body ?? ""}
              placeholder="Goals, injuries, tendencies — invisible to the client."
              rows={4}
              style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)", fontFamily: "var(--font-body)", fontSize: 14, resize: "vertical" }}
            />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.16em" }}>
                {note ? `LAST UPDATED ${new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}` : "NOT YET SAVED"}
              </div>
              <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>SAVE NOTE</button>
            </div>
          </form>
        </Section>

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
                      <Time iso={b.starts_at} format="datetime" /> · {b.mode.replace("_", " ").toUpperCase()}
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
                      <Time iso={cls.starts_at} format="datetime" />
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
    </CoachShell>
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
