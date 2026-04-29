import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listTrainerInbox, listProfilesByIds, listTrainerOwnedSessions } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import {
  acceptTrainerBookingAction,
  rejectTrainerBookingAction,
  cancelTrainerBookingAction,
  completeTrainerBookingAction,
} from "@/lib/trainer-booking-actions";
import { testVideoRoomAction } from "@/lib/video/test-action";
import { routines } from "@/lib/data/routines";
import type { TrainerBooking, TrainerSessionRow } from "@/lib/data/types";

export default async function TrainerDashboard({ searchParams }: { searchParams: { accepted?: string; rejected?: string; completed?: string; test_room?: string; group_created?: string; group_cancelled?: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/dashboard");

  const all = await listTrainerInbox(trainer.id);
  const userIds = Array.from(new Set(all.map(b => b.user_id)));
  const profiles = await listProfilesByIds(userIds);
  const groupSessions = await listTrainerOwnedSessions(trainer.id);

  const now = Date.now();
  const pending = all.filter(b => b.status === "pending_trainer");
  const upcoming = all.filter(b => b.status === "confirmed" && new Date(b.starts_at).getTime() >= now - 30 * 60_000);
  const recent = all.filter(b => b.status === "completed" || b.status === "rejected" || b.status === "cancelled" || b.status === "no_show").slice(0, 8);

  const flash = searchParams.accepted ? "BOOKING ACCEPTED · CLIENT NOTIFIED"
              : searchParams.rejected ? "BOOKING DECLINED · PAYMENT REFUNDED IF APPLICABLE"
              : searchParams.completed ? "SESSION COMPLETE · LOGGED TO CLIENT HISTORY"
              : searchParams.group_created ? "GROUP SESSION CREATED · NOW BOOKABLE"
              : searchParams.group_cancelled ? "GROUP SESSION CANCELLED · ATTENDEES REFUNDED"
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 80 }}>
        <div style={{ padding: "20px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>TRAINER · {trainer.name.toUpperCase()}</div>
            <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>DASHBOARD.</h1>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/trainer/classes/new" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              + NEW CLASS
            </Link>
            <Link href="/trainer/sessions/new" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              + NEW GROUP SESSION
            </Link>
            <Link href="/trainer/clients" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              YOUR CLIENTS →
            </Link>
            <Link href="/trainer/earnings" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              EARNINGS →
            </Link>
            <Link href="/trainer/classes" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              YOUR CLASSES →
            </Link>
            <Link href="/trainer/programs" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              YOUR PROGRAMS →
            </Link>
            <Link href="/trainer/availability" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              EDIT AVAILABILITY →
            </Link>
            <Link href="/trainer/profile" className="e-mono" style={{ color: "var(--sky)", textDecoration: "none", letterSpacing: "0.2em", fontSize: 11 }}>
              EDIT PROFILE →
            </Link>
          </div>
        </div>

        {flash && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
              ✓ {flash}
            </div>
          </section>
        )}

        {trainer.payout_status !== "active" && (
          <section style={{ padding: "14px 22px 0" }}>
            <Link href="/trainer/onboarding/connect" className="e-mono" style={{
              display: "block", padding: "14px 16px", borderRadius: 12,
              background: "rgba(243,200,99,0.1)", border: "1px solid rgba(243,200,99,0.5)",
              color: "rgb(243,200,99)", fontSize: 11, letterSpacing: "0.18em", textDecoration: "none",
            }}>
              ⚠ SET UP PAYOUTS SO YOU CAN GET PAID — 80/20 SPLIT VIA STRIPE →
            </Link>
          </section>
        )}

        {searchParams.test_room && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em", display: "flex", flexDirection: "column", gap: 6 }}>
              <div>✓ TEST ROOM CREATED</div>
              <a href={searchParams.test_room} target="_blank" rel="noreferrer" style={{ color: "var(--bone)", wordBreak: "break-all", textDecoration: "underline" }}>
                {searchParams.test_room}
              </a>
            </div>
          </section>
        )}

        <section style={{ padding: "14px 22px 0" }}>
          <form action={testVideoRoomAction}>
            <button type="submit" className="btn" style={{ padding: "10px 16px", fontSize: 11, background: "transparent", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.4)", letterSpacing: "0.18em" }}>
              TEST VIDEO ROOM
            </button>
          </form>
        </section>

        {/* INBOX */}
        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            01 / INBOX · {pending.length} PENDING
          </div>
          {pending.length === 0 ? (
            <Empty body="No new requests." />
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.map(b => <PendingRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
            </div>
          )}
        </section>

        {/* UPCOMING */}
        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            02 / UPCOMING · {upcoming.length}
          </div>
          {upcoming.length === 0 ? (
            <Empty body="No confirmed sessions on the books." />
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map(b => <UpcomingRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
            </div>
          )}
        </section>

        {/* GROUP SESSIONS · YOUR UPCOMING */}
        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            GROUP SESSIONS · YOUR UPCOMING · {groupSessions.length}
          </div>
          {groupSessions.length === 0 ? (
            <Empty body="No group sessions on the books. Create one with + NEW GROUP SESSION above." />
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {groupSessions.map(({ session, attendees }) => <GroupSessionRow key={session.id} session={session} attendees={attendees} />)}
            </div>
          )}
        </section>

        {/* RECENT */}
        {recent.length > 0 && (
          <section style={{ padding: "32px 22px 0" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", letterSpacing: "0.2em", fontSize: 10 }}>
              03 / RECENT
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map(b => <RecentRow key={b.id} booking={b} clientName={profiles[b.user_id]?.display_name ?? "Member"} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PendingRow({ booking, clientName }: { booking: TrainerBooking; clientName: string }) {
  const dt = new Date(booking.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
            {dateStr} · {timeStr} · {booking.mode === "video" ? "VIDEO" : "IN PERSON"}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6 }}>{clientName.toUpperCase()}</div>
        </div>
        <div className="e-mono" style={{ color: booking.paid_status === "paid" ? "var(--sky)" : "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>
          {booking.paid_status.toUpperCase()} · ${(booking.price_cents / 100).toFixed(0)}
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
  const dt = new Date(booking.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const joinable = isSessionJoinable(booking.starts_at, booking.ends_at);
  const routine = booking.routine_slug ? routines.find(r => r.slug === booking.routine_slug) : null;
  // Show MARK COMPLETE within 5 min of end and beyond, so trainers can log
  // completion from the dashboard without re-entering the room.
  const canMarkComplete = Date.now() > new Date(booking.ends_at).getTime() - 5 * 60_000;

  return (
    <div style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: 80, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{clientName.toUpperCase()}</div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {booking.mode === "video" ? "VIDEO" : "IN PERSON"} · {Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000)}M
          {routine ? ` · ${routine.name}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {joinable ? (
          <Link href={`/train/session/${booking.id}`} className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>
            JOIN →
          </Link>
        ) : (
          <Link href={`/train/session/${booking.id}`} className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none" }}>
            DETAIL →
          </Link>
        )}
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
  const dt = new Date(booking.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase();
  return (
    <div style={{
      display: "flex", gap: 12, padding: 12, borderRadius: 12,
      background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)",
      opacity: booking.status === "completed" ? 1 : 0.6,
    }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 10, letterSpacing: "0.18em", minWidth: 60 }}>{dateStr}</div>
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
  const dt = new Date(session.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const full = attendees >= session.capacity;
  return (
    <Link href={`/trainer/sessions/${session.id}`} className="lift" style={{
      padding: 14, borderRadius: 14,
      background: "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
      display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
      color: "var(--bone)", textDecoration: "none",
    }}>
      <div style={{ minWidth: 96, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
          {(session.title ?? "GROUP SESSION").toUpperCase()}
        </div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.7)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {session.mode === "video" ? "VIDEO" : "IN PERSON"} · ({attendees}/{session.capacity}) · ${(session.price_cents / 100).toFixed(0)}/PERSON
          {full ? " · FULL" : ""}
        </div>
      </div>
      <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>MANAGE →</span>
    </Link>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
      {body}
    </div>
  );
}
