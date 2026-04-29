import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getTrainerSessionRow, listGroupSessionRoster } from "@/lib/data/queries";
import { isSessionJoinable } from "@/lib/video/provider";
import { cancelGroupSessionAction, completeGroupSessionAction } from "@/lib/trainer-session-actions";

export default async function TrainerGroupSessionPage({ params }: { params: { id: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect(`/login?next=/trainer/sessions/${params.id}`);

  const session = await getTrainerSessionRow(params.id);
  if (!session) notFound();
  if (session.trainer_id !== trainer.id) redirect("/trainer/dashboard?error=unauthorized");

  const roster = await listGroupSessionRoster(session.id);
  const dt = new Date(session.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const durationMin = Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60_000);
  const joinable = isSessionJoinable(session.starts_at, session.ends_at);
  const canComplete = ["open", "full", "confirmed"].includes(session.status);
  const canCancel = ["open", "full", "confirmed"].includes(session.status);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>GROUP SESSION · {dateStr} · {timeStr}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(28px, 6vw, 48px)", lineHeight: 0.95, marginTop: 8 }}>
            {(session.title ?? "GROUP SESSION").toUpperCase()}
          </h1>
          <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.18em" }}>
            {session.mode === "video" ? "VIDEO" : "IN PERSON"} · {durationMin}M · {roster.length}/{session.capacity} BOOKED · ${(session.price_cents / 100).toFixed(0)}/PERSON · STATUS: {session.status.toUpperCase()}
          </div>
          {session.description && (
            <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.75)", lineHeight: 1.6 }}>{session.description}</p>
          )}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {session.mode === "video" && joinable && session.video_room_url && (
            <a href={session.video_room_url} target="_blank" rel="noreferrer" className="btn btn-sky" style={{ padding: "10px 18px" }}>JOIN ROOM →</a>
          )}
          {canComplete && (
            <form action={completeGroupSessionAction}>
              <input type="hidden" name="session_id" value={session.id} />
              <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>MARK COMPLETE</button>
            </form>
          )}
          {canCancel && (
            <form action={cancelGroupSessionAction}>
              <input type="hidden" name="session_id" value={session.id} />
              <button type="submit" className="btn" style={{ padding: "10px 18px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
                CANCEL SESSION
              </button>
            </form>
          )}
        </div>

        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            ROSTER · {roster.length}/{session.capacity}
          </div>
          {roster.length === 0 ? (
            <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No attendees yet.
            </div>
          ) : (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {roster.map(({ booking, profile }) => (
                <Link
                  key={booking.id}
                  href={`/trainer/clients/${booking.user_id}`}
                  className="lift"
                  style={{
                    display: "flex", gap: 12, padding: 12, borderRadius: 12,
                    background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                    color: "var(--bone)", textDecoration: "none", alignItems: "center",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(143,184,214,0.3)", flexShrink: 0 }}>
                    {profile.avatar_url ? (
                      <Photo src={profile.avatar_url} alt={profile.display_name ?? "Member"} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                        <Icon name="user" size={20} />
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
        </section>
      </div>
    </div>
  );
}
