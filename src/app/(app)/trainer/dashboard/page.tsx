import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { AutoRefresh } from "@/components/site/AutoRefresh";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerInbox, listProfilesByIds, listTrainerOwnedSessions, getTrainerEarnings } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import {
  acceptTrainerBookingAction,
  rejectTrainerBookingAction,
  cancelTrainerBookingAction,
  completeTrainerBookingAction,
} from "@/lib/trainer-booking-actions";
import { routines } from "@/lib/data/routines";
import { fmtDollars, fmtDurationMin } from "@/lib/format";
import type { TrainerBooking, TrainerSessionRow } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage({ searchParams }: { searchParams: { accepted?: string; rejected?: string; completed?: string; group_created?: string; group_cancelled?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/dashboard");

  const [all, groupSessions, earnings] = await Promise.all([
    listTrainerInbox(coach.id),
    listTrainerOwnedSessions(coach.id),
    getTrainerEarnings(coach.id),
  ]);
  const userIds = Array.from(new Set(all.map(b => b.user_id)));
  const profiles = await listProfilesByIds(userIds);

  const now = Date.now();
  const pending = all.filter(b => b.status === "pending_trainer");
  const upcoming = all.filter(b => b.status === "confirmed" && new Date(b.starts_at).getTime() >= now - 30 * 60_000);
  const recent = all.filter(b => b.status === "completed" || b.status === "rejected" || b.status === "cancelled" || b.status === "no_show").slice(0, 6);

  const flash = searchParams.accepted ? "BOOKING ACCEPTED · CLIENT NOTIFIED"
              : searchParams.rejected ? "BOOKING DECLINED · PAYMENT REFUNDED IF APPLICABLE"
              : searchParams.completed ? "SESSION COMPLETE · LOGGED TO CLIENT HISTORY"
              : searchParams.group_created ? "GROUP SESSION CREATED · NOW BOOKABLE"
              : searchParams.group_cancelled ? "GROUP SESSION CANCELLED · ATTENDEES REFUNDED"
              : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/dashboard">
      <AutoRefresh interval={30000} />
      {flash && (
        <div className="e-mono" style={{ marginBottom: 24, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          ✓ {flash}
        </div>
      )}

      {/* HERO STATS */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <Stat label="THIS MONTH · YOUR CUT" value={fmtDollars(earnings.thisMonthCents, true)} sub={`${earnings.thisMonthCount} ${earnings.thisMonthCount === 1 ? "payout" : "payouts"}`} />
        <Stat label="UPCOMING SESSIONS" value={upcoming.length.toString()} sub={pending.length > 0 ? `${pending.length} pending request${pending.length === 1 ? "" : "s"}` : "All clear"} />
        <Stat label="GROUP SESSIONS" value={groupSessions.length.toString()} sub={groupSessions.length > 0 ? "On the books" : "None scheduled"} />
        <Stat label="LIFETIME · YOUR CUT" value={fmtDollars(earnings.lifetimeCents)} sub={`${earnings.lifetimeCount} payout${earnings.lifetimeCount === 1 ? "" : "s"}`} />
      </section>

      {/* QUICK ACTIONS */}
      <section style={{ marginTop: 26, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <ActionTile href="/trainer/classes/new" label="+ NEW CLASS" hint="Schedule a class slot" />
        <ActionTile href="/trainer/sessions/new" label="+ NEW GROUP SESSION" hint="Run a small-group call" />
        <ActionTile href="/messages" label="MESSAGES →" hint="Reply to clients" />
        <ActionTile href="/trainer/earnings" label="EARNINGS →" hint="Payout breakdown + log" />
      </section>

      {/* INBOX */}
      <CoachSection index="01" title={`REQUESTS · ${pending.length} PENDING`} hint="Members asking for a 1-on-1. Accept to lock in the slot.">
        {pending.length === 0 ? (
          <CoachEmpty body="Inbox is clear. New 1-on-1 requests land here the moment a member books one." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map(b => <PendingRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
          </div>
        )}
      </CoachSection>

      {/* UPCOMING */}
      <CoachSection index="02" title={`UPCOMING · ${upcoming.length}`} hint="Confirmed 1-on-1 sessions on the books.">
        {upcoming.length === 0 ? (
          <CoachEmpty body="Nothing confirmed yet. As soon as you accept a request from the inbox above, it'll show up here with a JOIN button." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map(b => <UpcomingRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
          </div>
        )}
      </CoachSection>

      {/* GROUP SESSIONS */}
      <CoachSection title={`GROUP SESSIONS · ${groupSessions.length}`} hint="Open group calls. Click to manage roster, mark complete, or cancel.">
        {groupSessions.length === 0 ? (
          <CoachEmpty body="No group sessions scheduled. Tap + NEW GROUP SESSION to add one." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groupSessions.map(({ session, attendees }) => <GroupSessionRow key={session.id} session={session} attendees={attendees} />)}
          </div>
        )}
      </CoachSection>

      {/* RECENT */}
      {recent.length > 0 && (
        <CoachSection index="03" title="RECENT">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map(b => <RecentRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
          </div>
        </CoachSection>
      )}
    </CoachShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1 }}>{value}</div>
      <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>{sub}</div>
    </div>
  );
}

function ActionTile({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link href={href} className="lift" style={{
      display: "block", padding: 16, borderRadius: 14,
      background: "linear-gradient(135deg, rgba(143,184,214,0.14), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
      color: "var(--bone)", textDecoration: "none",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.2em" }}>{label}</div>
      <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.14em" }}>{hint}</div>
    </Link>
  );
}

function PendingRow({ booking, clientName }: { booking: TrainerBooking; clientName: string }) {
  const routine = booking.routine_slug ? routines.find(r => r.slug === booking.routine_slug) : null;
  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
            <Time iso={booking.starts_at} format="datetime" /> · {booking.mode === "video" ? "VIDEO" : "IN PERSON"}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{clientName.toUpperCase()}</div>
        </div>
        <div className="e-mono" style={{ color: booking.paid_status === "paid" ? "var(--sky)" : "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>
          {booking.paid_status.toUpperCase()} · {fmtDollars(booking.price_cents)}
        </div>
      </div>
      {routine && (
        <div className="e-mono" style={{ marginTop: 8, fontSize: 10, color: "rgba(242,238,232,0.7)", letterSpacing: "0.14em" }}>
          PLANNED: {routine.name} · {routine.duration_min}M
        </div>
      )}
      {booking.client_goals && (
        <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.6 }}>"{booking.client_goals}"</p>
      )}
      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <form action={acceptTrainerBookingAction}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>ACCEPT</button>
        </form>
        <form action={rejectTrainerBookingAction} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <input
            type="text"
            name="reason"
            placeholder="reason (optional)"
            style={{ padding: "9px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)", fontSize: 12, fontFamily: "var(--font-body)" }}
          />
          <button type="submit" className="btn" style={{ padding: "10px 18px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
            DECLINE
          </button>
        </form>
      </div>
    </div>
  );
}

function UpcomingRow({ booking, clientName }: { booking: TrainerBooking; clientName: string }) {
  const joinable = isSessionJoinable(booking.starts_at, booking.ends_at);
  const routine = booking.routine_slug ? routines.find(r => r.slug === booking.routine_slug) : null;
  const canMarkComplete = Date.now() > new Date(booking.ends_at).getTime() - 5 * 60_000;
  const durationMin = Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000);

  return (
    <div style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: 110, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
          <Time iso={booking.starts_at} format="date" />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1, marginTop: 6 }}>
          <Time iso={booking.starts_at} format="time" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{clientName.toUpperCase()}</div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {booking.mode === "video" ? "VIDEO" : "IN PERSON"} · {fmtDurationMin(durationMin)}
          {routine ? ` · ${routine.name}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {joinable ? (
          <Link href={`/train/session/${booking.id}`} className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>
            JOIN →
          </Link>
        ) : null}
        <Link href={`/booking/${booking.id}`} className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none" }}>
          DETAILS →
        </Link>
        {canMarkComplete && (
          <form action={completeTrainerBookingAction}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "8px 12px", fontSize: 10 }}>MARK COMPLETE</button>
          </form>
        )}
        <form action={cancelTrainerBookingAction}>
          <input type="hidden" name="booking_id" value={booking.id} />
          <input type="hidden" name="return_to" value="/trainer/dashboard" />
          <button type="submit" className="btn" style={{ padding: "8px 12px", fontSize: 10, background: "transparent", color: "rgba(242,238,232,0.55)", border: "1px solid rgba(143,184,214,0.2)" }}>CANCEL</button>
        </form>
      </div>
    </div>
  );
}

function RecentRow({ booking, clientName }: { booking: TrainerBooking; clientName: string }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: 12, borderRadius: 12,
      background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)",
      opacity: booking.status === "completed" ? 1 : 0.6,
    }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.18em", minWidth: 70 }}>
        <Time iso={booking.starts_at} format="date" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{clientName.toUpperCase()}</div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.45)", fontSize: 9, letterSpacing: "0.18em", marginTop: 3 }}>
          {booking.status.replace(/_/g, " ").toUpperCase()}
          {booking.duration_actual_min ? ` · ${booking.duration_actual_min}M` : ""}
        </div>
      </div>
    </div>
  );
}

function GroupSessionRow({ session, attendees }: { session: TrainerSessionRow; attendees: number }) {
  const full = attendees >= session.capacity;
  return (
    <Link href={`/trainer/sessions/${session.id}`} className="lift" style={{
      padding: 14, borderRadius: 14,
      background: "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
      display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
      color: "var(--bone)", textDecoration: "none",
    }}>
      <div style={{ minWidth: 110, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
          <Time iso={session.starts_at} format="date" />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1, marginTop: 6 }}>
          <Time iso={session.starts_at} format="time" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
          {(session.title ?? "GROUP SESSION").toUpperCase()}
        </div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {session.mode === "video" ? "VIDEO" : "IN PERSON"} · ({attendees}/{session.capacity}) · {fmtDollars(session.price_cents)}/PERSON
          {full ? " · FULL" : ""}
        </div>
      </div>
      <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>MANAGE →</span>
    </Link>
  );
}
