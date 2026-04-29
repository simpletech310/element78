import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getClass, listClassRoster } from "@/lib/data/queries";
import { cancelClassAction, markClassCompleteAction } from "@/lib/trainer-class-actions";

export default async function TrainerClassDetailPage({ params }: { params: { id: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect(`/login?next=/trainer/classes/${params.id}`);

  const cls = await getClass(params.id);
  if (!cls) notFound();
  if (cls.trainer_id !== trainer.id) redirect("/trainer/classes?error=unauthorized");

  const roster = await listClassRoster(cls.id);
  const status = cls.status ?? "scheduled";
  const dt = new Date(cls.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isPast = dt.getTime() < Date.now();
  const canComplete = status === "scheduled" && (isPast || dt.getTime() - Date.now() < 60 * 60_000); // within an hour or already past
  const canCancel = status === "scheduled" && !isPast;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/classes" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>YOUR CLASSES</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
            {dateStr} · {timeStr}
          </div>
          <h1 className="e-display" style={{ fontSize: "clamp(28px, 6vw, 48px)", lineHeight: 0.95, marginTop: 8 }}>{cls.name.toUpperCase()}</h1>
          <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.18em" }}>
            {(cls.kind ?? "—").toUpperCase()} · {cls.duration_min}M · {roster.length}/{cls.capacity} BOOKED · STATUS: {status.toUpperCase()}
          </div>
        </div>

        {(canCancel || canComplete) && (
          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {canComplete && (
              <form action={markClassCompleteAction}>
                <input type="hidden" name="class_id" value={cls.id} />
                <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>MARK COMPLETE</button>
              </form>
            )}
            {canCancel && (
              <form action={cancelClassAction}>
                <input type="hidden" name="class_id" value={cls.id} />
                <button type="submit" className="btn" style={{ padding: "10px 18px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
                  CANCEL CLASS
                </button>
              </form>
            )}
          </div>
        )}

        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            ROSTER · {roster.length}/{cls.capacity}
          </div>
          {roster.length === 0 ? (
            <div style={{ marginTop: 14, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No bookings yet.
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
                      {booking.paid_status.toUpperCase()}
                      {booking.spot_number != null ? ` · SPOT ${booking.spot_number}` : ""}
                      {booking.notes ? ` · "${booking.notes.slice(0, 60)}${booking.notes.length > 60 ? "…" : ""}"` : ""}
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
