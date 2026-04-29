import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Icon } from "@/components/ui/Icon";
import {
  getTrainer,
  getTrainerSessionSettings,
  listAvailabilityRules,
  listAvailabilityBlocks,
  listActiveTrainerBookingsInWindow,
  listActiveTrainerSessionsInWindow,
  listOpenGroupSessionsForTrainer,
} from "@/lib/data/queries";
import { getUser } from "@/lib/auth";
import { generateSlots } from "@/lib/trainer-availability";
import { routines } from "@/lib/data/routines";
import { requestTrainerBookingAction } from "@/lib/trainer-booking-actions";
import { joinGroupSessionAction } from "@/lib/trainer-session-actions";
import type { TrainerSessionMode } from "@/lib/data/types";

type SearchParams = { mode?: string; day?: string; error?: string; program_session?: string };

function fmtDollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
}

function fmtTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function TrainerBookingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const [trainer, user] = await Promise.all([getTrainer(params.slug), getUser()]);
  if (!trainer) notFound();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trainers/${params.slug}/book`)}`);

  const settings = await getTrainerSessionSettings(trainer.id);
  if (!settings) {
    return (
      <Shell trainerName={trainer.name} backHref={`/trainers/${trainer.slug}`}>
        <Empty title="1-ON-1 NOT YET AVAILABLE" body={`${trainer.name} hasn't enabled private sessions yet. Try a class instead.`} />
      </Shell>
    );
  }

  // Build the booking window.
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + settings.booking_window_days);

  const [rules, blocks, existing, existingSessions, groupSessions] = await Promise.all([
    listAvailabilityRules(trainer.id),
    listAvailabilityBlocks(trainer.id, now.toISOString(), windowEnd.toISOString()),
    listActiveTrainerBookingsInWindow(trainer.id, now.toISOString(), windowEnd.toISOString()),
    listActiveTrainerSessionsInWindow(trainer.id, now.toISOString(), windowEnd.toISOString()),
    listOpenGroupSessionsForTrainer(trainer.id, now.toISOString(), windowEnd.toISOString()),
  ]);

  const requestedMode = (searchParams.mode === "video" || searchParams.mode === "in_person")
    ? (searchParams.mode as TrainerSessionMode)
    : (settings.modes[0] ?? "video");

  const allSlots = generateSlots({
    rules,
    blocks,
    existingBookings: existing,
    existingSessions,
    settings,
    fromUtc: now,
    toUtc: windowEnd,
    preferredMode: requestedMode,
  });

  // Group slots by day for the picker.
  const byDay = new Map<string, typeof allSlots>();
  for (const s of allSlots) {
    const k = dayKey(new Date(s.starts_at));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  const dayKeys = Array.from(byDay.keys());
  const selectedDayKey = searchParams.day && byDay.has(searchParams.day) ? searchParams.day : (dayKeys[0] ?? "");
  const selectedSlots = selectedDayKey ? (byDay.get(selectedDayKey) ?? []) : [];

  const error = searchParams.error;

  return (
    <Shell trainerName={trainer.name} backHref={`/trainers/${trainer.slug}`}>
      <section style={{ padding: "20px 22px 0" }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
          1-ON-1 SESSION · {settings.duration_min} MIN · {fmtDollars(settings.price_cents)}
        </div>
        <h1 className="e-display glow" style={{ fontSize: "clamp(40px, 9vw, 64px)", lineHeight: 0.92, marginTop: 12 }}>
          BOOK<br/>{trainer.name.split(" ")[0].toUpperCase()}.
        </h1>
        {settings.bio_for_1on1 && (
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", maxWidth: 540, lineHeight: 1.6 }}>
            {settings.bio_for_1on1}
          </p>
        )}
      </section>

      {error && (
        <section style={{ padding: "14px 22px 0" }}>
          <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 12, letterSpacing: "0.12em" }}>
            {error}
          </div>
        </section>
      )}

      {/* GROUP SESSIONS — trainer-led group sessions with shared room. Listed
          ahead of the slot picker because they're the marquee offering when
          the trainer has any scheduled. */}
      {groupSessions.filter(g => g.attendees < g.session.capacity).length > 0 && (
        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            GROUP SESSIONS · OPEN
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {groupSessions
              .filter(g => g.attendees < g.session.capacity)
              .map(({ session, attendees }) => {
                const dt = new Date(session.starts_at);
                const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={session.id} style={{ padding: 14, borderRadius: 14, background: "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))", border: "1px solid rgba(143,184,214,0.32)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 96, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
                      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                        {(session.title ?? "GROUP SESSION").toUpperCase()}
                      </div>
                      <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
                        {session.mode === "video" ? "VIDEO" : "IN PERSON"} · {attendees} OF {session.capacity} SEATS · {fmtDollars(session.price_cents)}/PERSON
                      </div>
                      {session.description && (
                        <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.7)", lineHeight: 1.5 }}>{session.description}</p>
                      )}
                    </div>
                    <form action={joinGroupSessionAction}>
                      <input type="hidden" name="session_id" value={session.id} />
                      <input type="hidden" name="trainer_slug" value={trainer.slug} />
                      <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px", fontSize: 11 }}>JOIN →</button>
                    </form>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Mode picker */}
      {settings.modes.length > 1 && (
        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>01 · MODE</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {settings.modes.map(m => {
              const active = m === requestedMode;
              return (
                <Link
                  key={m}
                  href={`/trainers/${trainer.slug}/book?mode=${m}`}
                  className="e-mono"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: active ? "1px solid var(--sky)" : "1px solid rgba(143,184,214,0.25)",
                    background: active ? "var(--sky)" : "rgba(143,184,214,0.06)",
                    color: active ? "var(--ink)" : "var(--sky)",
                    textDecoration: "none",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                  }}
                >
                  {m === "video" ? "VIDEO CALL" : "IN PERSON · GYM"}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Day picker */}
      <section style={{ padding: "28px 22px 0" }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>02 · DAY</div>
        {dayKeys.length === 0 ? (
          <div style={{ marginTop: 12, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
            No open slots for {requestedMode === "video" ? "video" : "in-person"} sessions in the next {settings.booking_window_days} days.
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {dayKeys.map(k => {
              const d = new Date(k + "T00:00:00");
              const active = k === selectedDayKey;
              return (
                <Link
                  key={k}
                  href={`/trainers/${trainer.slug}/book?mode=${requestedMode}&day=${k}`}
                  className="e-mono"
                  style={{
                    flexShrink: 0,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: active ? "1px solid var(--sky)" : "1px solid rgba(143,184,214,0.2)",
                    background: active ? "rgba(143,184,214,0.18)" : "var(--haze)",
                    color: active ? "var(--sky)" : "rgba(242,238,232,0.7)",
                    textDecoration: "none",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                  }}
                >
                  {fmtDayLabel(d)}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Form: time slot + routine + goals */}
      {selectedSlots.length > 0 && (
        <form action={requestTrainerBookingAction} style={{ padding: "28px 22px 80px" }}>
          <input type="hidden" name="trainer_id" value={trainer.id} />
          <input type="hidden" name="trainer_slug" value={trainer.slug} />
          <input type="hidden" name="mode" value={requestedMode} />
          {searchParams.program_session && (
            <input type="hidden" name="program_session_id" value={searchParams.program_session} />
          )}

          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>03 · TIME</div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {selectedSlots.map((s, i) => (
              <label
                key={s.starts_at}
                className="e-mono slot-pill"
                style={{
                  cursor: "pointer",
                  padding: "12px 8px",
                  borderRadius: 10,
                  background: "var(--haze)",
                  border: "1px solid rgba(143,184,214,0.2)",
                  textAlign: "center",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "var(--bone)",
                }}
              >
                <input
                  type="radio"
                  name="slot"
                  value={`${s.starts_at}|${s.ends_at}`}
                  defaultChecked={i === 0}
                  required
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                />
                {fmtTimeLabel(s.starts_at)}
              </label>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>04 · ROUTINE (OPTIONAL)</div>
            <select
              name="routine_slug"
              defaultValue=""
              className="e-mono"
              style={{
                marginTop: 12,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--haze)",
                border: "1px solid rgba(143,184,214,0.25)",
                color: "var(--bone)",
                fontSize: 12,
                letterSpacing: "0.12em",
              }}
            >
              <option value="">— LET TRAINER CHOOSE —</option>
              {routines.map(r => (
                <option key={r.slug} value={r.slug}>
                  {r.name} · {r.duration_min}M · {r.intensity}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>05 · GOALS</div>
            <textarea
              name="goals"
              rows={4}
              placeholder="What do you want out of this session? Any injuries or constraints?"
              style={{
                marginTop: 12,
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "var(--haze)",
                border: "1px solid rgba(143,184,214,0.25)",
                color: "var(--bone)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "16px 24px" }}>
              REQUEST · {fmtDollars(settings.price_cents)}
            </button>
            <span className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.18em" }}>
              CHARGED ON TRAINER ACCEPT · REFUND IF DECLINED
            </span>
          </div>
        </form>
      )}
    </Shell>
  );
}

function Shell({ trainerName, backHref, children }: { trainerName: string; backHref: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={backHref} aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>{trainerName.split(" ")[0].toUpperCase()}</span>
          </Link>
        </div>
        {children}
      </div>
      <SiteFooter />
      <FloatingTabBar />
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <section style={{ padding: "60px 22px" }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>{title}</div>
      <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 480, lineHeight: 1.6 }}>{body}</p>
    </section>
  );
}
