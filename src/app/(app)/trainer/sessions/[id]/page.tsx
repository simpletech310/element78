import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { DateTimeField } from "@/components/site/DateTimeField";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getTrainerSessionRow, listGroupSessionRoster } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import { cancelGroupSessionAction, completeGroupSessionAction, editGroupSessionAction, startGroupSessionAction } from "@/lib/trainer-session-actions";
import { fmtDollars, fmtDurationMin } from "@/lib/format";
import { SessionVideoFrame, SessionLocked, SessionInPersonPanel } from "@/components/site/SessionVideoFrame";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { LiveSessionStage } from "@/components/site/LiveSessionStage";
import { getRoutine, routines } from "@/lib/data/routines";

export const dynamic = "force-dynamic";

export default async function CoachGroupSessionPage({ params, searchParams }: { params: { id: string }; searchParams: { edited?: string; error?: string; manage?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect(`/login?next=/trainer/sessions/${params.id}`);

  const session = await getTrainerSessionRow(params.id);
  if (!session) notFound();
  if (session.trainer_id !== coach.id) redirect("/trainer/dashboard?error=unauthorized");

  const roster = await listGroupSessionRoster(session.id);
  const activeAttendees = roster.filter(r => r.booking.status === "pending_trainer" || r.booking.status === "confirmed").length;
  const hasAttendees = activeAttendees > 0;
  const canEdit = session.is_group && session.status !== "cancelled" && session.status !== "completed";
  const durationMin = Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000);
  const joinable = isSessionJoinable(session.starts_at, session.ends_at);
  const canComplete = ["open", "full", "confirmed"].includes(session.status);
  const canCancel = ["open", "full", "confirmed"].includes(session.status);
  const routine = session.routine_slug ? getRoutine(session.routine_slug) : undefined;
  const isLive = session.status !== "completed" && session.status !== "cancelled";

  // Live + video + joinable + the coach has actually pressed START SESSION
  // (live_started_at is set) → take over the whole viewport with the
  // immersive LiveSessionStage (Daily + synced routine, swappable PIP).
  // ?manage=1 escape hatch lets the coach pop out to the regular page
  // (roster, mark-complete, cancel) without triggering the loop.
  const stageMode = isLive && joinable && session.mode === "video" && !!session.live_started_at && searchParams.manage !== "1";
  if (stageMode) {
    return (
      <LiveSessionStage
        dailyUrl={session.video_room_url}
        videoProvider={session.video_provider}
        routine={routine ?? null}
        live={{ mode: "coach", sessionId: session.id }}
        backHref={`/trainer/sessions/${session.id}?manage=1`}
        trainerName={coach.name}
        isCoach={true}
      />
    );
  }

  return (
    <CoachShell coach={coach} pathname="/trainer/sessions">
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
        GROUP SESSION · <Time iso={session.starts_at} format="datetime" />
      </div>
      <h1 className="e-display" style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 0.95, marginTop: 8 }}>
        {(session.title ?? "GROUP SESSION").toUpperCase()}
      </h1>
      <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.6)", fontSize: 10, letterSpacing: "0.18em" }}>
        {session.mode === "video" ? "VIDEO" : "IN PERSON"} · {fmtDurationMin(durationMin)} · {roster.length}/{session.capacity} BOOKED · {fmtDollars(session.price_cents)}/PERSON · STATUS · {session.status.toUpperCase()}
      </div>
      {session.description && (
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.75)", lineHeight: 1.6, maxWidth: 640 }}>{session.description}</p>
      )}

      {searchParams.edited && (
        <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          ✓ SESSION UPDATED
        </div>
      )}
      {searchParams.error && (
        <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.error}
        </div>
      )}

      {/* Live call surface — embedded Daily room (or in-person info) so the
          coach can lead the group through the routine without leaving this
          page. The RoutinePlayer below is shared screen real estate; both the
          coach and each member see Daily on top and the workout video below. */}
      {isLive && (
        <div style={{ marginTop: 22 }}>
          {session.mode === "video" ? (
            joinable ? (
              <SessionVideoFrame videoRoomUrl={session.video_room_url} videoProvider={session.video_provider} />
            ) : (
              <SessionLocked startsAt={session.starts_at} />
            )
          ) : (
            <SessionInPersonPanel />
          )}
        </div>
      )}

      {/* Stacked workout video — coach drives the timeline; every confirmed
          attendee mirrors it via realtime on trainer_sessions.routine_state. */}
      {routine && isLive && (
        <div style={{ marginTop: 24 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            GUIDED ROUTINE · YOU DRIVE · ATTENDEES MIRROR
          </div>
          <div style={{ marginTop: 12 }}>
            <RoutinePlayer routine={routine} live={{ mode: "coach", sessionId: session.id }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* START SESSION fires the realtime ping so every attendee gets the
            IncomingCallAlert — also (re)provisions the Daily room if needed. */}
        {isLive && joinable && session.mode === "video" && (
          <form action={startGroupSessionAction}>
            <input type="hidden" name="session_id" value={session.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>
              {session.live_started_at ? "RE-RING ATTENDEES" : "START SESSION · CALL EVERYONE"}
            </button>
          </form>
        )}
        {canComplete && (
          <form action={completeGroupSessionAction}>
            <input type="hidden" name="session_id" value={session.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>
              {session.live_started_at ? "END SESSION · MARK COMPLETE" : "MARK COMPLETE"}
            </button>
          </form>
        )}
        {canCancel && (
          <form action={cancelGroupSessionAction}>
            <input type="hidden" name="session_id" value={session.id} />
            <button type="submit" className="btn" style={{ padding: "12px 22px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
              CANCEL SESSION
            </button>
          </form>
        )}
      </div>

      {canEdit && (
        <details
          style={{
            marginTop: 28,
            padding: 18,
            borderRadius: 14,
            background: "var(--haze)",
            border: "1px solid rgba(143,184,214,0.2)",
          }}
        >
          <summary
            className="e-mono"
            style={{ cursor: "pointer", color: "var(--sky)", letterSpacing: "0.22em", fontSize: 11, listStyle: "none" }}
          >
            EDIT SESSION {hasAttendees ? `· ${activeAttendees} ATTENDEE${activeAttendees === 1 ? "" : "S"} · SOME FIELDS LOCKED` : "· NO ATTENDEES YET"}
          </summary>

          <form action={editGroupSessionAction} style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <input type="hidden" name="session_id" value={session.id} />

            <Field label="TITLE">
              <input name="title" defaultValue={session.title ?? ""} placeholder="MORNING POWER · GROUP" className="ta-input" />
            </Field>
            <Field label="DESCRIPTION">
              <textarea name="description" rows={3} defaultValue={session.description ?? ""} placeholder="What this group session covers" className="ta-input" style={{ resize: "vertical" }} />
            </Field>

            <DateTimeField name="starts_at" label={hasAttendees ? "STARTS AT · LOCKED (HAS ATTENDEES)" : "STARTS AT"} defaultValue={session.starts_at} />
            <DateTimeField name="ends_at" label={hasAttendees ? "ENDS AT · LOCKED (HAS ATTENDEES)" : "ENDS AT"} defaultValue={session.ends_at} />
            {hasAttendees && (
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.45)", letterSpacing: "0.18em" }}>
                Time edits ignored while attendees are booked. Cancel the session to reschedule.
              </div>
            )}

            <Field label={hasAttendees ? "MODE · LOCKED (HAS ATTENDEES)" : "MODE"}>
              <select name="mode" defaultValue={session.mode} disabled={hasAttendees} className="ta-input">
                <option value="video">Video</option>
                <option value="in_person">In Person</option>
              </select>
            </Field>

            <Field label={`CAPACITY · MIN ${Math.max(2, activeAttendees)} (CURRENT ATTENDEES: ${activeAttendees})`}>
              <input
                name="capacity"
                type="number"
                min={Math.max(2, activeAttendees)}
                max={50}
                defaultValue={session.capacity}
                className="ta-input"
              />
            </Field>

            <Field label={hasAttendees ? "PRICE · USD · LOCKED (HAS ATTENDEES)" : "PRICE PER PERSON · USD (0 = FREE)"}>
              <input
                name="price_dollars"
                type="number"
                min={0}
                step="0.01"
                defaultValue={(session.price_cents / 100).toFixed(2)}
                disabled={hasAttendees}
                className="ta-input"
                placeholder="25.00"
              />
            </Field>

            <Field label="ROUTINE">
              <select name="routine_slug" defaultValue={session.routine_slug ?? ""} className="ta-input">
                <option value="">— LET TRAINER CHOOSE —</option>
                {routines.map(r => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} · {r.duration_min}M · {r.intensity}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ marginTop: 4 }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>
                SAVE CHANGES
              </button>
            </div>
          </form>

          <style>{`
            details > summary::-webkit-details-marker { display: none; }
            .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
            .ta-input:focus { outline: none; border-color: var(--sky); }
            .ta-input:disabled { opacity: 0.45; cursor: not-allowed; }
          `}</style>
        </details>
      )}

      <CoachSection title={`ROSTER · ${roster.length}/${session.capacity}`}>
        {roster.length === 0 ? (
          <CoachEmpty body="No attendees yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roster.map(({ booking, profile }) => (
              <Link
                key={booking.id}
                href={`/trainer/clients/${booking.user_id}`}
                className="lift"
                style={{
                  display: "flex", gap: 12, padding: 14, borderRadius: 12,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none", alignItems: "center",
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
                  {profile.avatar_url ? (
                    <Photo src={profile.avatar_url} alt={profile.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                      <Icon name="user" size={22} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{(profile.display_name ?? "Member").toUpperCase()}</div>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}>
                    {booking.status.replace(/_/g, " ").toUpperCase()} · {booking.paid_status.toUpperCase()}
                    {booking.client_goals ? ` · "${booking.client_goals.slice(0, 50)}${booking.client_goals.length > 50 ? "…" : ""}"` : ""}
                  </div>
                </div>
                <Icon name="chevron" size={16} />
              </Link>
            ))}
          </div>
        )}
      </CoachSection>
    </CoachShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
      {label}
      {children}
    </label>
  );
}
