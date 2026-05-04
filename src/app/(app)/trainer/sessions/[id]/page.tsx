import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getTrainerSessionRow, listGroupSessionRoster } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import { cancelGroupSessionAction, completeGroupSessionAction } from "@/lib/trainer-session-actions";
import { fmtDollars, fmtDurationMin } from "@/lib/format";
import { SessionVideoFrame, SessionLocked, SessionInPersonPanel } from "@/components/site/SessionVideoFrame";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { getRoutine } from "@/lib/data/routines";

export const dynamic = "force-dynamic";

export default async function CoachGroupSessionPage({ params }: { params: { id: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect(`/login?next=/trainer/sessions/${params.id}`);

  const session = await getTrainerSessionRow(params.id);
  if (!session) notFound();
  if (session.trainer_id !== coach.id) redirect("/trainer/dashboard?error=unauthorized");

  const roster = await listGroupSessionRoster(session.id);
  const durationMin = Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000);
  const joinable = isSessionJoinable(session.starts_at, session.ends_at);
  const canComplete = ["open", "full", "confirmed"].includes(session.status);
  const canCancel = ["open", "full", "confirmed"].includes(session.status);
  const routine = session.routine_slug ? getRoutine(session.routine_slug) : undefined;
  const isLive = session.status !== "completed" && session.status !== "cancelled";

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

      {/* Stacked workout video — only when a routine is set on the session. */}
      {routine && isLive && (
        <div style={{ marginTop: 24 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>GUIDED ROUTINE</div>
          <div style={{ marginTop: 12 }}>
            <RoutinePlayer routine={routine} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {canComplete && (
          <form action={completeGroupSessionAction}>
            <input type="hidden" name="session_id" value={session.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>MARK COMPLETE</button>
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
