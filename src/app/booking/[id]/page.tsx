import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Time } from "@/components/site/Time";
import { SubmitButton } from "@/components/site/SubmitButton";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSessionJoinable } from "@/lib/video/provider";
import { getActiveCoachClientNote } from "@/lib/coach-notes";
import {
  initiateCallAction,
  cancelTrainerBookingAction,
  completeTrainerBookingAction,
} from "@/lib/trainer-booking-actions";
import { fmtDollars, fmtDurationMin } from "@/lib/format";
import { routines } from "@/lib/data/routines";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/booking/${params.id}`);

  const admin = createAdminClient();
  const { data: bookingRow } = await admin
    .from("trainer_bookings")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const booking = bookingRow as null | {
    id: string;
    user_id: string;
    trainer_id: string;
    starts_at: string;
    ends_at: string;
    mode: "video" | "in_person";
    status: string;
    paid_status: string;
    price_cents: number;
    client_goals: string | null;
    routine_slug: string | null;
    video_room_url: string | null;
  };
  if (!booking) notFound();

  // Auth: must be either the booker or the booking's coach (via auth_user_id).
  const { data: trainerRow } = await admin
    .from("trainers")
    .select("id, slug, name, headline, avatar_url, auth_user_id")
    .eq("id", booking.trainer_id)
    .maybeSingle();
  const coach = trainerRow as null | { id: string; slug: string; name: string; headline: string | null; avatar_url: string | null; auth_user_id: string | null };
  if (!coach) notFound();

  const isCoach = coach.auth_user_id === user.id;
  const isMember = booking.user_id === user.id;
  if (!isCoach && !isMember) redirect("/home?error=unauthorized");

  // Counterparty profile.
  const otherUserId = isCoach ? booking.user_id : coach.auth_user_id;
  const { data: otherProfile } = await admin
    .from("profiles")
    .select("display_name, avatar_url, handle")
    .eq("id", otherUserId ?? "")
    .maybeSingle();
  const counterpartyName = isCoach
    ? ((otherProfile as { display_name?: string } | null)?.display_name ?? "Member")
    : coach.name;
  const counterpartyAvatar = isCoach
    ? ((otherProfile as { avatar_url?: string } | null)?.avatar_url ?? null)
    : coach.avatar_url;
  const counterpartyHandle = isCoach
    ? ((otherProfile as { handle?: string } | null)?.handle ?? null)
    : coach.slug;

  const durationMin = Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000);
  const joinable = isSessionJoinable(booking.starts_at, booking.ends_at);
  const routine = booking.routine_slug ? routines.find(r => r.slug === booking.routine_slug) : null;

  // Coach-side: load private notes + recent history with this client.
  let coachNoteBody: string | null = null;
  let priorBookings: Array<{ id: string; starts_at: string; status: string; trainer_notes: string | null }> = [];
  if (isCoach) {
    const note = await getActiveCoachClientNote(coach.id, booking.user_id);
    coachNoteBody = note?.body ?? null;
    const { data: prior } = await admin
      .from("trainer_bookings")
      .select("id, starts_at, status, trainer_notes")
      .eq("trainer_id", coach.id)
      .eq("user_id", booking.user_id)
      .neq("id", booking.id)
      .order("starts_at", { ascending: false })
      .limit(3);
    priorBookings = (prior as typeof priorBookings) ?? [];
  }

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href={isCoach ? "/trainer/dashboard" : "/account/sessions"} style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>{isCoach ? "DASHBOARD" : "MY SESSIONS"}</span>
        </Link>

        {/* Hero */}
        <div style={{ marginTop: 18, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--sky)", flexShrink: 0 }}>
            {counterpartyAvatar ? (
              <Photo src={counterpartyAvatar} alt={counterpartyName} style={{ width: "100%", height: "100%" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                <Icon name="user" size={32} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
              {isCoach ? "1-ON-1 WITH" : "COACHED BY"}
            </div>
            <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 0.95, marginTop: 8 }}>
              {counterpartyName.toUpperCase()}
            </h1>
            <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.65)", fontSize: 11, letterSpacing: "0.16em" }}>
              <Time iso={booking.starts_at} format="datetime" /> · {fmtDurationMin(durationMin)} · {booking.mode === "video" ? "VIDEO" : "IN PERSON"}
            </div>
            <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.18em" }}>
              {booking.status.replace(/_/g, " ").toUpperCase()} · {booking.paid_status.toUpperCase()} · {fmtDollars(booking.price_cents)}
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isCoach && booking.mode === "video" && (
            <form action={initiateCallAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <SubmitButton pendingLabel="STARTING ROOM…">INITIATE CALL →</SubmitButton>
            </form>
          )}
          {isMember && joinable && booking.video_room_url && (
            <Link href={`/train/session/${booking.id}`} className="btn btn-sky" style={{ padding: "12px 22px" }}>JOIN →</Link>
          )}
          {isMember && !joinable && (
            <a href={`/api/ics/trainer-booking/${booking.id}`} className="btn" style={{ padding: "12px 22px", background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }}>ADD TO CALENDAR</a>
          )}
          {(isCoach || isMember) && (booking.status === "confirmed" || booking.status === "pending_trainer") && (
            <form action={cancelTrainerBookingAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <input type="hidden" name="return_to" value={isCoach ? "/trainer/dashboard" : "/account/sessions"} />
              <SubmitButton variant="rose" pendingLabel="CANCELLING…">CANCEL</SubmitButton>
            </form>
          )}
          {isCoach && booking.status === "confirmed" && Date.now() > new Date(booking.ends_at).getTime() - 5 * 60_000 && (
            <form action={completeTrainerBookingAction}>
              <input type="hidden" name="booking_id" value={booking.id} />
              <SubmitButton pendingLabel="LOGGING…">MARK COMPLETE</SubmitButton>
            </form>
          )}
        </div>

        {/* Goals + routine */}
        {(booking.client_goals || routine) && (
          <section style={{ marginTop: 28, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>SESSION CONTEXT</div>
            {booking.client_goals && (
              <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.6 }}>"{booking.client_goals}"</p>
            )}
            {routine && (
              <div className="e-mono" style={{ marginTop: 10, fontSize: 11, color: "rgba(242,238,232,0.65)", letterSpacing: "0.14em" }}>
                PLANNED ROUTINE · {routine.name} · {routine.duration_min}M
              </div>
            )}
          </section>
        )}

        {/* Coach-only: private notes + recent history */}
        {isCoach && (
          <>
            {coachNoteBody && (
              <section style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>YOUR PRIVATE NOTES ON THIS CLIENT</div>
                <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{coachNoteBody}</p>
                <Link href={`/trainer/clients/${booking.user_id}`} className="e-mono" style={{ marginTop: 12, display: "inline-block", color: "var(--sky)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none" }}>EDIT NOTES →</Link>
              </section>
            )}

            {priorBookings.length > 0 && (
              <section style={{ marginTop: 22 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>RECENT SESSIONS WITH THIS CLIENT</div>
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {priorBookings.map(b => (
                    <Link key={b.id} href={`/booking/${b.id}`} className="e-mono" style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10,
                      background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)",
                      fontSize: 11, letterSpacing: "0.14em", color: "rgba(242,238,232,0.75)", textDecoration: "none",
                    }}>
                      <span><Time iso={b.starts_at} format="datetime" /></span>
                      <span style={{ color: "rgba(242,238,232,0.5)" }}>{b.status.replace(/_/g, " ").toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="e-mono" style={{ marginTop: 28, fontSize: 10, color: "rgba(242,238,232,0.4)", letterSpacing: "0.16em" }}>
          @{counterpartyHandle ?? "—"}
        </div>
      </div>
    </div>
  );
}
