import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listEventsByTrainer } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function TrainerEventsPage() {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/events");
  const events = await listEventsByTrainer(coach.id);

  return (
    <CoachShell coach={coach} pathname="/trainer/events">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>YOUR EVENTS</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>HOST SOMETHING.</h1>
        </div>
        <Link href="/trainer/events/new" className="btn btn-sky" style={{ padding: "10px 18px" }}>+ NEW EVENT</Link>
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        {events.length === 0 ? (
          <div className="e-mono" style={{ padding: 28, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", color: "rgba(242,238,232,0.55)", fontSize: 11, letterSpacing: "0.18em" }}>
            NO EVENTS YET. RUN ONE — FREE OR TICKETED.
          </div>
        ) : (
          events.map(e => (
            <Link
              key={e.id}
              href={`/trainer/events/${e.id}`}
              style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", textDecoration: "none", color: "var(--bone)" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{e.title}</div>
                <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                  {new Date(e.starts_at).toLocaleString()} · {e.location?.name ?? "GYM"}
                </div>
              </div>
              <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: e.status === "published" ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>
                {e.status.toUpperCase()}
              </div>
              <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,238,232,0.65)" }}>
                {e.price_cents > 0 ? `$${(e.price_cents / 100).toFixed(0)} · ${e.paid_count} PAID` : `FREE · ${e.rsvp_count} RSVP`}
              </div>
            </Link>
          ))
        )}
      </div>
    </CoachShell>
  );
}
