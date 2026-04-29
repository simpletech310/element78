import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { RoutinePlayer } from "@/components/site/RoutinePlayer";
import { getUser } from "@/lib/auth";
import { getTrainerBooking } from "@/lib/data/queries";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { isSessionJoinable } from "@/lib/video/provider";
import { getRoutine } from "@/lib/data/routines";
import { completeTrainerBookingAction, cancelTrainerBookingAction } from "@/lib/trainer-booking-actions";
import { createClient } from "@/lib/supabase/server";

export default async function TrainerSessionRoom({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/train/session/${params.id}`)}`);

  const booking = await getTrainerBooking(params.id);
  if (!booking) notFound();

  // Authorize: must be the booking's user OR the trainer who owns it.
  const trainer = await getTrainerForCurrentUser();
  const isClient = booking.user_id === user.id;
  const isTrainer = trainer && trainer.id === booking.trainer_id;
  if (!isClient && !isTrainer) notFound();

  if (booking.status !== "confirmed" && booking.status !== "completed") {
    return (
      <Shell>
        <ErrorPanel
          title="SESSION NOT YET ACTIVE"
          body={
            booking.status === "pending_trainer"
              ? "The trainer hasn't accepted this request yet."
              : booking.status === "rejected"
              ? "This request was declined."
              : booking.status === "cancelled"
              ? "This session was cancelled."
              : "This session can't be joined right now."
          }
          backHref={isTrainer ? "/trainer/dashboard" : "/account/sessions"}
        />
      </Shell>
    );
  }

  const joinable = isSessionJoinable(booking.starts_at, booking.ends_at);

  // Look up trainer info for the header.
  const sb = createClient();
  const { data: trainerRow } = await sb.from("trainers").select("name, slug, avatar_url").eq("id", booking.trainer_id).maybeSingle();
  const trainerName = (trainerRow as { name?: string } | null)?.name ?? "Trainer";

  // Optional routine context.
  const routine = booking.routine_slug ? getRoutine(booking.routine_slug) : undefined;

  const startStr = new Date(booking.starts_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" });

  return (
    <Shell>
      <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Link href={isTrainer ? "/trainer/dashboard" : "/account/sessions"} aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>BACK</span>
        </Link>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.22em" }}>
          {booking.mode === "video" ? "VIDEO ROOM" : "IN-PERSON SESSION"} · {trainerName.toUpperCase()}
        </div>
      </div>

      <section style={{ padding: "12px 22px 0" }}>
        <h1 className="e-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 0.95 }}>
          {booking.status === "completed" ? "SESSION RECAP." : "LIVE SESSION."}
        </h1>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.6)", fontSize: 11, letterSpacing: "0.18em", marginTop: 8 }}>
          {startStr.toUpperCase()} · {Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000)} MIN
        </div>
      </section>

      {/* Video / room area */}
      <section style={{ padding: "20px 22px 0" }}>
        {booking.mode === "video" ? (
          joinable ? (
            <VideoFrame videoRoomUrl={booking.video_room_url} videoProvider={booking.video_provider} />
          ) : (
            <Locked startsAt={booking.starts_at} />
          )
        ) : (
          <InPersonPanel />
        )}
      </section>

      {/* Goals + routine context */}
      {(booking.client_goals || routine) && (
        <section style={{ padding: "28px 22px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {booking.client_goals && (
              <Card label="CLIENT GOALS" body={booking.client_goals} />
            )}
            {routine && (
              <Card label="PLANNED ROUTINE" body={`${routine.name} · ${routine.duration_min}M · ${routine.exercises.length} EXERCISES`} />
            )}
          </div>
        </section>
      )}

      {/* RoutinePlayer embedded so trainer + client can run through together */}
      {routine && booking.status !== "completed" && (
        <section style={{ padding: "28px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>GUIDED ROUTINE</div>
          <div style={{ marginTop: 12 }}>
            <RoutinePlayer routine={routine} />
          </div>
        </section>
      )}

      {/* Trainer-only complete form */}
      {isTrainer && booking.status === "confirmed" && (
        <section style={{ padding: "28px 22px 80px" }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>TRAINER · WRAP</div>
          <form action={completeTrainerBookingAction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <label className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
              ACTUAL DURATION (MIN)
              <input
                type="number"
                name="duration_actual_min"
                min={1}
                max={300}
                defaultValue={Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60000)}
                style={{ marginTop: 6, display: "block", width: 120, padding: "10px 12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", fontSize: 14 }}
              />
            </label>
            <label className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.6)", letterSpacing: "0.18em" }}>
              TRAINER NOTES
              <textarea
                name="trainer_notes"
                rows={3}
                placeholder="What did you work on? How did they do?"
                style={{ marginTop: 6, display: "block", width: "100%", padding: "12px", borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", fontFamily: "var(--font-body)", fontSize: 14, resize: "vertical" }}
              />
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>
                MARK COMPLETE
              </button>
            </div>
          </form>

          {/* Cancel-from-room safety net */}
          <form action={cancelTrainerBookingAction} style={{ marginTop: 14 }}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <input type="hidden" name="return_to" value="/trainer/dashboard" />
            <button type="submit" className="btn" style={{ padding: "10px 18px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)", fontSize: 11 }}>
              CANCEL SESSION
            </button>
          </form>
        </section>
      )}

      {booking.status === "completed" && (
        <section style={{ padding: "28px 22px 80px" }}>
          <div style={{ padding: 18, borderRadius: 14, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)" }}>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
              ✓ COMPLETED · {booking.duration_actual_min ?? "—"} MIN
            </div>
            {booking.trainer_notes && (
              <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.8)", lineHeight: 1.6 }}>
                {booking.trainer_notes}
              </p>
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}

function VideoFrame({ videoRoomUrl, videoProvider }: { videoRoomUrl: string | null; videoProvider: string | null }) {
  const isMock = !videoRoomUrl || videoRoomUrl.startsWith("mock://") || videoProvider === "mock";

  if (isMock) {
    return (
      <div style={{
        aspectRatio: "16/9", borderRadius: 18, overflow: "hidden",
        background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
        border: "1px solid rgba(143,184,214,0.32)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24, textAlign: "center",
      }}>
        <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 11 }}>📹 MOCK VIDEO ROOM</div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3.5vw, 32px)", lineHeight: 1, color: "var(--bone)" }}>
          BOTH OF YOU WOULD BE ON DAILY.CO HERE.
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: "rgba(242,238,232,0.6)", maxWidth: 480, lineHeight: 1.6 }}>
          Set <code className="e-mono" style={{ color: "var(--sky)" }}>DAILY_API_KEY</code> and <code className="e-mono" style={{ color: "var(--sky)" }}>DAILY_DOMAIN</code> in env, and{" "}
          <code className="e-mono" style={{ color: "var(--sky)" }}>src/lib/video/provider.ts</code> auto-creates a real Daily room on accept.
        </p>
      </div>
    );
  }

  // Real Daily room: embed via iframe. Daily Prebuilt UI lives at the room URL.
  return (
    <div style={{ aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)" }}>
      <iframe
        src={videoRoomUrl ?? ""}
        allow="camera; microphone; autoplay; encrypted-media; fullscreen; display-capture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: "100%", height: "100%", border: 0, background: "var(--ink)" }}
        title="Element 78 video session"
      />
    </div>
  );
}

function Locked({ startsAt }: { startsAt: string }) {
  const dt = new Date(startsAt);
  const minsAway = Math.round((dt.getTime() - Date.now()) / 60_000);
  return (
    <div style={{
      aspectRatio: "16/9", borderRadius: 18, overflow: "hidden",
      background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>NOT YET OPEN</div>
      <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: 28, color: "var(--bone)" }}>
        OPENS 10 MIN BEFORE START
      </div>
      <div className="e-mono" style={{ marginTop: 8, fontSize: 11, color: "rgba(242,238,232,0.55)", letterSpacing: "0.18em" }}>
        {minsAway > 0 ? `${minsAway} MIN AWAY` : "JUST CLOSED"}
      </div>
    </div>
  );
}

function InPersonPanel() {
  return (
    <div style={{
      borderRadius: 18, padding: 24,
      background: "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(46,127,176,0.04))",
      border: "1px solid rgba(143,184,214,0.32)",
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>IN PERSON · GYM</div>
      <h2 className="e-display" style={{ marginTop: 10, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 0.95 }}>
        MEET AT THE GYM.
      </h2>
      <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
        This is a face-to-face session. The routine below will guide both of you through the planned exercises.
      </p>
    </div>
  );
}

function Card({ label, body }: { label: string; body: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 9 }}>{label}</div>
      <p style={{ marginTop: 8, fontSize: 13, color: "rgba(242,238,232,0.85)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function ErrorPanel({ title, body, backHref }: { title: string; body: string; backHref: string }) {
  return (
    <section style={{ padding: "60px 22px" }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>{title}</div>
      <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", maxWidth: 480, lineHeight: 1.6 }}>{body}</p>
      <Link href={backHref} className="btn btn-sky" style={{ marginTop: 18, display: "inline-block", padding: "12px 20px" }}>BACK</Link>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
