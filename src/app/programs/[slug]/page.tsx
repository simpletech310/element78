import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getProgram, getEnrollment, listEnrollmentCompletions, listProgramAnnouncements, listJournalEntriesForEnrollment } from "@/lib/data/queries";
import { saveJournalEntryAction } from "@/lib/journal-actions";
import { getSavedKindRefs } from "@/lib/data/saved-queries";
import { getUser } from "@/lib/auth";
import { enrollAction, completeSessionAction, leaveAction } from "@/lib/program-actions";
import { materializeAutoCompletions } from "@/lib/program-completion";
import { getRoutine } from "@/lib/data/routines";
import { SaveButton } from "@/components/site/SaveButton";
import type { ProgramSession } from "@/lib/data/types";

export default async function ProgramDetail({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { locked?: string; enrolled?: string };
}) {
  const user = await getUser();
  const data = await getProgram(params.slug);
  if (!data) notFound();
  const { program, sessions } = data;

  // Auto-mark class & 1-on-1 sessions as completed if the underlying booking
  // has happened. Cheap and idempotent.
  if (user) await materializeAutoCompletions(user.id);

  const enrollment = user ? await getEnrollment(user.id, program.id) : null;
  const completions = enrollment ? await listEnrollmentCompletions(enrollment.id) : [];
  const announcements = enrollment ? await listProgramAnnouncements(program.id) : [];
  const journalEntries = enrollment ? await listJournalEntriesForEnrollment(enrollment.id) : {};
  const completedIds = new Set(completions.map(c => c.session_id));
  const savedProgramIds = user ? await getSavedKindRefs(user.id, "program") : new Set<string>();
  const isSaved = savedProgramIds.has(program.id);

  const isAuthed = !!user;
  const isActive = enrollment?.status === "active";
  const isCompleted = enrollment?.status === "completed";
  const isPendingPayment = enrollment?.status === "pending_payment";
  const currentDay = enrollment?.current_day ?? 1;
  const currentSession = sessions.find(s => s.day_index === currentDay) ?? sessions[0];
  const completedCount = completions.length;
  const pct = Math.round((completedCount / Math.max(1, program.total_sessions)) * 100);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={isAuthed} />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 540 }}>
        {program.hero_image && <Photo src={program.hero_image} alt="" className="zoom-on-hover" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.05) 25%, rgba(10,14,20,0.95) 80%, var(--ink) 100%)" }} />
        <div style={{ position: "relative", padding: "56px 22px 48px", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Link href="/programs" className="e-mono reveal" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sky)", letterSpacing: "0.18em" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={14} /></span>
              ALL PROGRAMS
            </Link>
            <SaveButton
              kind="program"
              ref_id={program.id}
              ref_slug={program.slug}
              ref_name={program.name}
              ref_image={program.hero_image}
              isSaved={isSaved}
              return_to={`/programs/${program.slug}`}
            />
          </div>

          <div className="e-mono reveal reveal-d1" style={{ color: "var(--sky)", marginTop: 24 }}>{program.duration_label}</div>
          <h1 className="e-display reveal reveal-d2" style={{ fontSize: "clamp(48px, 11vw, 104px)", marginTop: 12, lineHeight: 0.92 }}>{program.name}</h1>
          {program.subtitle && (
            <p className="reveal reveal-d3" style={{ marginTop: 18, fontSize: "clamp(20px, 3.4vw, 26px)", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--bone)", maxWidth: 560 }}>
              {program.subtitle}
            </p>
          )}
          <p className="reveal reveal-d3" style={{ marginTop: 14, fontSize: 15, color: "rgba(242,238,232,0.72)", maxWidth: 560, lineHeight: 1.65 }}>
            {program.description}
          </p>

          {/* Stats strip */}
          <div className="reveal reveal-d4" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(242,238,232,0.12)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            <Stat label="PRICE" v={program.price_cents > 0 ? `$${(program.price_cents / 100).toFixed(0)}` : "FREE"} accent />
            <Stat label="SESSIONS" v={String(program.total_sessions)} />
            <Stat label="LEVEL" v={program.intensity ?? "—"} />
            <Stat label="WHERE" v={program.surfaces.map(s => s.toUpperCase()).join(" · ")} />
          </div>

          {/* CTA cluster */}
          <div className="reveal reveal-d4" style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!isAuthed && (
              <>
                <Link href={`/login?next=/programs/${program.slug}`} className="btn btn-sky" style={{ minWidth: 200 }}>
                  {program.requires_payment ? `SIGN IN · $${(program.price_cents/100).toFixed(0)}` : "SIGN IN TO ENROLL"}
                </Link>
                <Link href="/join" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>JOIN FREE</Link>
              </>
            )}
            {program.requires_payment && (
              <p className="e-mono" style={{ width: "100%", marginTop: 6, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em" }}>
                INCLUDED FREE WITH ELITE MEMBERSHIP · ONE-TIME PURCHASE OTHERWISE
              </p>
            )}
            {isAuthed && !enrollment && (
              <form action={enrollAction}>
                <input type="hidden" name="program_id" value={program.id} />
                <input type="hidden" name="program_slug" value={program.slug} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 200 }}>
                  {program.requires_payment ? `ENROLL · $${(program.price_cents / 100).toFixed(0)}` : "ENROLL · FREE"}
                </button>
              </form>
            )}
            {isAuthed && enrollment && enrollment.status === "left" && (
              <form action={enrollAction}>
                <input type="hidden" name="program_id" value={program.id} />
                <input type="hidden" name="program_slug" value={program.slug} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 200 }}>RE-ENROLL</button>
              </form>
            )}
            {isAuthed && isPendingPayment && (
              <form action={enrollAction}>
                <input type="hidden" name="program_id" value={program.id} />
                <input type="hidden" name="program_slug" value={program.slug} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 280 }}>
                  PAYMENT PENDING — COMPLETE CHECKOUT
                </button>
              </form>
            )}
            {isAuthed && enrollment && enrollment.status === "completed" && (
              <>
                <span className="btn btn-ghost" style={{ color: "var(--sky)", borderColor: "rgba(143,184,214,0.4)", cursor: "default" }}>✓ COMPLETED · {new Date(enrollment.completed_at ?? enrollment.started_at).toLocaleDateString()}</span>
                <form action={enrollAction}>
                  <input type="hidden" name="program_id" value={program.id} />
                  <input type="hidden" name="program_slug" value={program.slug} />
                  <button type="submit" className="btn btn-sky">REPEAT THE PROGRAM</button>
                </form>
              </>
            )}
          </div>

          {/* Active progress strip */}
          {isAuthed && isActive && (
            <div style={{ marginTop: 30, padding: 22, borderRadius: 18, background: "rgba(143,184,214,0.08)", border: "1px solid rgba(143,184,214,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR STREAK</div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)" }}>{completedCount} / {program.total_sessions} SESSIONS · {pct}%</div>
              </div>
              <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: "rgba(143,184,214,0.18)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--sky)", boxShadow: "0 0 8px rgba(143,184,214,0.6)" }} />
              </div>
              {currentSession && (
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                    <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>UP NEXT · DAY {currentDay}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6, letterSpacing: "0.02em" }}>{currentSession.name}</div>
                    <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 6, letterSpacing: "0.18em" }}>{currentSession.duration_min} MIN · {currentSession.kind?.toUpperCase()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link href="/train/player" className="btn btn-sky">START IN APP</Link>
                    <form action={completeSessionAction}>
                      <input type="hidden" name="enrollment_id" value={enrollment!.id} />
                      <input type="hidden" name="session_id" value={currentSession.id} />
                      <input type="hidden" name="program_slug" value={program.slug} />
                      <input type="hidden" name="day_index" value={currentDay} />
                      <input type="hidden" name="total_sessions" value={program.total_sessions} />
                      <input type="hidden" name="surface" value="app" />
                      <button type="submit" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.35)" }}>MARK COMPLETE</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* LOCK BANNER — paid programs are gated until Stripe confirms. We show
          this both when the user just got bounced from a routine launch
          (?locked=1) AND any time their enrollment is in pending_payment. */}
      {isAuthed && program.requires_payment && (isPendingPayment || searchParams?.locked) && (
        <section style={{ padding: "32px 22px 0", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{
            padding: "18px 20px", borderRadius: 14,
            background: "rgba(232,181,168,0.08)",
            border: "1px solid rgba(232,181,168,0.4)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
          }}>
            <div>
              <div className="e-mono" style={{ color: "var(--rose)", fontSize: 10, letterSpacing: "0.25em" }}>🔒 LOCKED</div>
              <p style={{ marginTop: 6, fontSize: 13, color: "rgba(242,238,232,0.78)", maxWidth: 540, lineHeight: 1.6 }}>
                Complete payment to unlock the schedule. None of the sessions can be started until the program is paid.
              </p>
            </div>
            <form action={enrollAction}>
              <input type="hidden" name="program_id" value={program.id} />
              <input type="hidden" name="program_slug" value={program.slug} />
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>
                COMPLETE CHECKOUT · ${(program.price_cents / 100).toFixed(0)}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* DAY-BY-DAY BREAKDOWN */}
      <section style={{ padding: "44px 22px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="e-mono" style={{ color: "var(--sky)" }}>01 / DAY BY DAY</div>
        <h2 className="e-display" style={{ fontSize: "clamp(36px, 6vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>THE SCHEDULE.</h2>

        {(() => {
          // Group by day_index, then render each day as a card with one or
          // more session items inside.
          const days = new Map<number, ProgramSession[]>();
          for (const s of sessions) {
            if (!days.has(s.day_index)) days.set(s.day_index, []);
            days.get(s.day_index)!.push(s);
          }
          const dayKeys = Array.from(days.keys()).sort((a, b) => a - b);
          return (
            <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {dayKeys.map(day => {
                const dayItems = (days.get(day) ?? []).sort((a, b) => a.session_index - b.session_index);
                const dayDone = dayItems.every(s => completedIds.has(s.id));
                const dayCurrent = isAuthed && isActive && day === currentDay;
                return (
                  <div key={day} style={{
                    padding: 18, borderRadius: 16,
                    background: dayCurrent ? "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.06))"
                              : dayDone ? "rgba(143,184,214,0.06)" : "rgba(143,184,214,0.04)",
                    border: dayCurrent ? "1px solid var(--sky)"
                           : dayDone ? "1px solid rgba(143,184,214,0.3)"
                           : "1px dashed rgba(143,184,214,0.2)",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <div className="e-mono" style={{ color: dayDone ? "var(--sky)" : "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.25em" }}>
                        DAY {day.toString().padStart(2, "0")} · {dayItems.length} {dayItems.length === 1 ? "SESSION" : "SESSIONS"}
                      </div>
                      {dayDone && <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>✓ DONE</span>}
                      {dayCurrent && !dayDone && <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>↑ TODAY</span>}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {dayItems.map(s => {
                        const done = completedIds.has(s.id);
                        return (
                          <SessionItem
                            key={s.id}
                            session={s}
                            done={done}
                            programSlug={program.slug}
                            isAuthed={isAuthed}
                            isActive={isActive}
                            enrollmentId={enrollment?.id ?? null}
                            totalSessions={program.total_sessions}
                          />
                        );
                      })}
                    </div>

                    {isAuthed && enrollment && dayItems[0] && (
                      <details style={{ marginTop: 12 }}>
                        <summary className="e-mono" style={{ cursor: "pointer", color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em", padding: "4px 0" }}>
                          + JOURNAL
                          {journalEntries[dayItems[0].id] ? " · SAVED" : ""}
                        </summary>
                        <form action={saveJournalEntryAction} style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                          <input type="hidden" name="enrollment_id" value={enrollment.id} />
                          <input type="hidden" name="session_id" value={dayItems[0].id} />
                          <input type="hidden" name="program_slug" value={program.slug} />
                          <textarea
                            name="body"
                            rows={3}
                            maxLength={4000}
                            placeholder="What worked? What hurt? Energy level?"
                            defaultValue={journalEntries[dayItems[0].id]?.body ?? ""}
                            style={{ padding: 10, borderRadius: 8, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)", fontSize: 13, fontFamily: "var(--font-body)", resize: "vertical" }}
                          />
                          <button type="submit" className="btn btn-sky" style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 10 }}>SAVE NOTE</button>
                        </form>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* LEAVE button at the bottom for active enrollments */}
      {isAuthed && isActive && (
        <section style={{ padding: "0 22px 60px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <form action={leaveAction}>
            <input type="hidden" name="enrollment_id" value={enrollment!.id} />
            <input type="hidden" name="program_slug" value={program.slug} />
            <button type="submit" className="e-mono" style={{ background: "transparent", border: "none", color: "rgba(242,238,232,0.45)", letterSpacing: "0.2em", cursor: "pointer", padding: 12 }}>
              LEAVE PROGRAM
            </button>
          </form>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: "60px 22px 96px", background: "linear-gradient(180deg, var(--ink) 0%, var(--haze) 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="e-mono" style={{ color: "var(--sky)" }}>READY?</div>
          <h2 className="e-display glow" style={{ fontSize: "clamp(36px, 7vw, 56px)", marginTop: 14, lineHeight: 0.95 }}>{program.name}<br/>STARTS WHEN YOU DO.</h2>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {!isAuthed && <Link href={`/login?next=/programs/${program.slug}`} className="btn btn-sky" style={{ minWidth: 200 }}>SIGN IN TO ENROLL</Link>}
            {isAuthed && !isActive && !isCompleted && !isPendingPayment && (
              <form action={enrollAction}>
                <input type="hidden" name="program_id" value={program.id} />
                <input type="hidden" name="program_slug" value={program.slug} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 200 }}>
                  {program.requires_payment ? `ENROLL · $${(program.price_cents / 100).toFixed(0)}` : "ENROLL · FREE"}
                </button>
              </form>
            )}
            {isAuthed && isPendingPayment && (
              <form action={enrollAction}>
                <input type="hidden" name="program_id" value={program.id} />
                <input type="hidden" name="program_slug" value={program.slug} />
                <button type="submit" className="btn btn-sky" style={{ minWidth: 280 }}>
                  PAYMENT PENDING — COMPLETE CHECKOUT
                </button>
              </form>
            )}
            <Link href="/programs" className="btn btn-ghost" style={{ color: "var(--bone)", borderColor: "rgba(242,238,232,0.3)" }}>OTHER PROGRAMS</Link>
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section style={{ padding: "0 22px 60px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>FROM YOUR COACH · {announcements.length}</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {announcements.map(a => (
                <div key={a.id} style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{a.title}</div>
                    <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.16em" }}>
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" }).toUpperCase()}
                    </div>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
      {user && <FloatingTabBar />}
    </div>
  );
}

function SessionItem({
  session,
  done,
  programSlug,
  isAuthed,
  isActive,
  enrollmentId,
  totalSessions,
}: {
  session: ProgramSession;
  done: boolean;
  programSlug: string;
  isAuthed: boolean;
  isActive: boolean;
  enrollmentId: string | null;
  totalSessions: number;
}) {
  const launchHref = launchHrefFor(session, programSlug);
  const refLabel = refKindLabel(session);

  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: done ? "rgba(143,184,214,0.08)" : "rgba(143,184,214,0.04)",
      border: done ? "1px solid rgba(143,184,214,0.3)" : "1px solid rgba(143,184,214,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="e-mono" style={{ color: done ? "var(--sky)" : "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>
          {refLabel} · {session.duration_min}M
        </div>
        {done && <span className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>✓</span>}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginTop: 4, letterSpacing: "0.02em" }}>
        {session.name}
      </div>
      {session.description && (
        <div style={{ fontSize: 12, color: "rgba(242,238,232,0.55)", marginTop: 4, lineHeight: 1.5 }}>
          {session.description}
        </div>
      )}
      {isAuthed && isActive && !done && launchHref && (
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href={launchHref} className="btn btn-sky" style={{ padding: "6px 12px", fontSize: 10 }}>
            {launchLabel(session)}
          </Link>
          {/* Manual override stays available for class/1-on-1 in case auto-tracking lags. */}
          {enrollmentId && (
            <form action={completeSessionAction}>
              <input type="hidden" name="enrollment_id" value={enrollmentId} />
              <input type="hidden" name="session_id" value={session.id} />
              <input type="hidden" name="program_slug" value={programSlug} />
              <input type="hidden" name="day_index" value={session.day_index} />
              <input type="hidden" name="total_sessions" value={totalSessions} />
              <input type="hidden" name="surface" value="app" />
              <button type="submit" className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 9, color: "rgba(242,238,232,0.6)", borderColor: "rgba(143,184,214,0.2)" }}>
                MARK DONE
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function launchHrefFor(s: ProgramSession, programSlug: string): string | null {
  if (s.ref_kind === "routine" && s.routine_slug) {
    const routine = getRoutine(s.routine_slug);
    if (routine) return `/train/routine/${s.routine_slug}?program_session=${s.id}&program_slug=${programSlug}`;
    return null;
  }
  if (s.ref_kind === "class_kind" && s.class_slug) {
    // Filter the catalog to just this class type.
    return `/classes?type=${encodeURIComponent(s.class_slug)}`;
  }
  if (s.ref_kind === "trainer_1on1" && s.trainer_slug_for_1on1) {
    // Deep-link straight to the trainer's booking page; the program_session
    // param flows through so completing the booking auto-checks the day off.
    return `/trainers/${s.trainer_slug_for_1on1}/book?program_session=${s.id}`;
  }
  if (s.ref_kind === "trainer_1on1") {
    // Legacy row without cached slug — fallback.
    return `/trainers`;
  }
  // Custom / legacy: no specific launch.
  return "/train";
}

function launchLabel(s: ProgramSession): string {
  switch (s.ref_kind) {
    case "routine": return "▶ START ROUTINE";
    case "class_kind": return "FIND CLASS →";
    case "trainer_1on1": return "BOOK 1-ON-1 →";
    default: return "START";
  }
}

function refKindLabel(s: ProgramSession): string {
  switch (s.ref_kind) {
    case "routine": return "STUDIO";
    case "class_kind": return "GYM CLASS";
    case "trainer_1on1": return "1-ON-1";
    default: return (s.kind ?? "SESSION").toUpperCase();
  }
}

function Stat({ label, v, accent }: { label: string; v: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 3.5vw, 22px)", color: accent ? "var(--sky)" : "var(--bone)", lineHeight: 1, letterSpacing: "0.02em" }}>{v}</div>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, marginTop: 6, letterSpacing: "0.2em" }}>{label}</div>
    </div>
  );
}
