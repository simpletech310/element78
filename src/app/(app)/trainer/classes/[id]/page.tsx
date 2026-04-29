import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getClass, listClassRoster } from "@/lib/data/queries";
import { cancelClassAction, markClassCompleteAction } from "@/lib/trainer-class-actions";
import { fmtDurationMin } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoachClassDetailPage({ params }: { params: { id: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect(`/login?next=/trainer/classes/${params.id}`);

  const cls = await getClass(params.id);
  if (!cls) notFound();
  if (cls.trainer_id !== coach.id) redirect("/trainer/classes?error=unauthorized");

  const roster = await listClassRoster(cls.id);
  const status = cls.status ?? "scheduled";
  const dt = new Date(cls.starts_at);
  const isPast = dt.getTime() < Date.now();
  const canComplete = status === "scheduled" && (isPast || dt.getTime() - Date.now() < 60 * 60_000);
  const canCancel = status === "scheduled" && !isPast;

  return (
    <CoachShell coach={coach} pathname="/trainer/classes">
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
        <Time iso={cls.starts_at} format="datetime" />
      </div>
      <h1 className="e-display" style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 0.95, marginTop: 8 }}>{cls.name.toUpperCase()}</h1>
      <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.6)", fontSize: 10, letterSpacing: "0.18em" }}>
        {(cls.kind ?? "—").toUpperCase()} · {fmtDurationMin(cls.duration_min)} · {roster.length}/{cls.capacity} BOOKED · STATUS · {status.toUpperCase()}
      </div>

      {(canCancel || canComplete) && (
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {canComplete && (
            <form action={markClassCompleteAction}>
              <input type="hidden" name="class_id" value={cls.id} />
              <button type="submit" className="btn btn-sky" style={{ padding: "12px 20px" }}>MARK COMPLETE</button>
            </form>
          )}
          {canCancel && (
            <form action={cancelClassAction}>
              <input type="hidden" name="class_id" value={cls.id} />
              <button type="submit" className="btn" style={{ padding: "12px 20px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
                CANCEL CLASS
              </button>
            </form>
          )}
        </div>
      )}

      <CoachSection title={`ROSTER · ${roster.length}/${cls.capacity}`}>
        {roster.length === 0 ? (
          <CoachEmpty body="No bookings yet." />
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
      </CoachSection>
    </CoachShell>
  );
}
