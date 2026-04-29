import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { listClientTrainerBookings } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import { cancelTrainerBookingAction } from "@/lib/trainer-booking-actions";
import { AutoRefresh } from "@/components/site/AutoRefresh";
import { routines } from "@/lib/data/routines";
import type { TrainerBookingStatus } from "@/lib/data/types";

const STATUS_LABEL: Record<TrainerBookingStatus, string> = {
  pending_trainer: "AWAITING TRAINER",
  confirmed: "CONFIRMED",
  rejected: "DECLINED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
  no_show: "NO-SHOW",
};

const STATUS_COLOR: Record<TrainerBookingStatus, string> = {
  pending_trainer: "rgba(242,238,232,0.6)",
  confirmed: "var(--sky)",
  rejected: "var(--rose)",
  cancelled: "rgba(242,238,232,0.45)",
  completed: "var(--sky)",
  no_show: "var(--rose)",
};

export default async function ClientSessionsPage({ searchParams }: { searchParams: { booked?: string; paid?: string; cancelled?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/sessions");

  const items = await listClientTrainerBookings(user.id);
  const now = Date.now();
  const upcoming = items.filter(({ booking }) =>
    new Date(booking.starts_at).getTime() >= now &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected"
  );
  const past = items.filter(({ booking }) =>
    new Date(booking.starts_at).getTime() < now ||
    booking.status === "cancelled" ||
    booking.status === "rejected"
  );

  const flash = searchParams.paid ? "PAYMENT RECEIVED · TRAINER WILL CONFIRM SHORTLY"
              : searchParams.booked ? "REQUEST SENT · COMPLETE PAYMENT TO HOLD THE SLOT"
              : searchParams.cancelled ? "CANCELLED"
              : null;

  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
      <Navbar authed={true} />
      <AutoRefresh interval={45000} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
          </Link>
        </div>

        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em" }}>YOUR · 1-ON-1</div>
          <h1 className="e-display" style={{ fontSize: "clamp(40px, 9vw, 64px)", lineHeight: 0.92, marginTop: 12 }}>SESSIONS.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.65)", maxWidth: 480, lineHeight: 1.6 }}>
            Private sessions you've booked with Element trainers — video or at the gym.
          </p>
        </section>

        {flash && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
              ✓ {flash}
            </div>
          </section>
        )}

        <section style={{ padding: "32px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>UPCOMING</div>
          {upcoming.length === 0 ? (
            <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No upcoming sessions.{" "}
              <Link href="/trainers" className="e-mono" style={{ color: "var(--sky)", marginLeft: 6 }}>BROWSE TRAINERS →</Link>
            </div>
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map(({ booking, trainer }) => (
                <BookingCard key={booking.id} booking={booking} trainer={trainer} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section style={{ padding: "32px 22px 0" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", letterSpacing: "0.2em", fontSize: 10 }}>PAST</div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {past.slice(0, 12).map(({ booking, trainer }) => (
                <BookingCard key={booking.id} booking={booking} trainer={trainer} compact />
              ))}
            </div>
          </section>
        )}
      </div>
      <TabBar />
    </div>
  );
}

function BookingCard({ booking, trainer, compact }: { booking: import("@/lib/data/types").TrainerBooking; trainer: import("@/lib/data/types").Trainer; compact?: boolean }) {
  const dt = new Date(booking.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const joinable = booking.status === "confirmed" && isSessionJoinable(booking.starts_at, booking.ends_at);
  const routine = booking.routine_slug ? routines.find(r => r.slug === booking.routine_slug) : null;
  const needsPay = booking.paid_status === "pending";

  return (
    <div className="lift" style={{
      display: "flex", gap: 14, padding: 14, borderRadius: 14,
      background: compact ? "var(--haze)" : "linear-gradient(135deg, rgba(143,184,214,0.15), rgba(46,127,176,0.04))",
      border: compact ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(143,184,214,0.28)",
      color: "var(--bone)", flexWrap: "wrap",
      opacity: booking.status === "cancelled" || booking.status === "rejected" ? 0.6 : 1,
    }}>
      <div style={{ minWidth: 70, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.2)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.18em" }}>{dateStr}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>
          {trainer.name.toUpperCase()}
        </div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {booking.mode === "video" ? "VIDEO CALL" : "IN PERSON · GYM"}
          {routine && ` · ${routine.name}`}
        </div>
        <div className="e-mono" style={{ marginTop: 6, fontSize: 9, color: STATUS_COLOR[booking.status], letterSpacing: "0.2em" }}>
          {STATUS_LABEL[booking.status]}
          {needsPay && booking.status !== "cancelled" && booking.status !== "rejected" ? " · PAYMENT DUE" : ""}
          {booking.duration_actual_min ? ` · ${booking.duration_actual_min}M LOGGED` : ""}
        </div>
        {booking.rejected_reason && (
          <div className="e-mono" style={{ marginTop: 6, fontSize: 10, color: "var(--rose)", letterSpacing: "0.1em" }}>
            "{booking.rejected_reason}"
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {needsPay && booking.status === "pending_trainer" && (
          <Link href={`/checkout/trainer/${booking.id}`} className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>
            PAY NOW
          </Link>
        )}
        {joinable && (
          <Link href={`/train/session/${booking.id}`} className="btn btn-sky" style={{ padding: "8px 14px", fontSize: 11 }}>
            JOIN →
          </Link>
        )}
        <Link href={`/booking/${booking.id}`} className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none" }}>
          DETAILS →
        </Link>
        {(booking.status === "pending_trainer" || booking.status === "confirmed") && (
          <>
            <a
              href={`/api/ics/trainer-booking/${booking.id}`}
              className="btn"
              style={{ padding: "8px 14px", fontSize: 10, background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }}
            >
              ADD TO CALENDAR
            </a>
            {trainer && (
              <Link
                href={`/trainers/${trainer.slug}/book?reschedule=${booking.id}`}
                className="btn"
                style={{ padding: "8px 14px", fontSize: 10, background: "transparent", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.4)" }}
              >
                RESCHEDULE
              </Link>
            )}
            <form action={cancelTrainerBookingAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="return_to" value="/account/sessions" />
              <button type="submit" className="btn" style={{ padding: "8px 14px", fontSize: 10, background: "transparent", color: "rgba(242,238,232,0.6)", border: "1px solid rgba(143,184,214,0.2)" }}>
                CANCEL
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
