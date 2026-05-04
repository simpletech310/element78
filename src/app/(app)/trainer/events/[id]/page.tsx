import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { createClient } from "@/lib/supabase/server";
import { listEventRsvps } from "@/lib/data/queries";
import { publishEventAction } from "@/lib/coach-actions";
import type { EventRow } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export default async function CoachEventDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { published?: string };
}) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/events");

  const sb = createClient();
  const { data } = await sb
    .from("events")
    .select("*, location:locations!events_location_id_fkey(name, city, state)")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) redirect("/trainer/events?error=not_found");
  const event = data as EventRow & { location: { name: string; city: string; state: string } | null };
  if (event.author_trainer_id !== coach.id) redirect("/trainer/events?error=unauthorized");

  const rsvps = await listEventRsvps(event.id);

  return (
    <CoachShell coach={coach} pathname="/trainer/events">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>EVENT · {event.status.toUpperCase()}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(32px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>{event.title}</h1>
          <div className="e-mono" style={{ marginTop: 8, fontSize: 10, letterSpacing: "0.16em", color: "rgba(242,238,232,0.5)" }}>
            {new Date(event.starts_at).toLocaleString()} · {event.location?.name ?? "GYM"} · {event.price_cents > 0 ? `$${(event.price_cents / 100).toFixed(2)}` : "FREE"}
            {event.capacity ? ` · ${event.rsvp_count}/${event.capacity}` : ` · ${event.rsvp_count} JOINED`}
          </div>
        </div>
        {event.status !== "published" ? (
          <form action={publishEventAction}>
            <input type="hidden" name="event_id" value={event.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>PUBLISH →</button>
          </form>
        ) : (
          <Link href={`/events/${event.slug}`} className="btn btn-ink" style={{ padding: "10px 18px" }}>VIEW PUBLIC →</Link>
        )}
      </div>

      {searchParams.published && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          PUBLISHED · WALL POST CREATED.
        </div>
      )}

      <section style={{ marginTop: 28, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
        <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(242,238,232,0.6)" }}>
          ATTENDEES · {rsvps.length}{event.price_cents > 0 ? ` · ${event.paid_count} PAID` : ""}
        </div>
        {rsvps.length === 0 ? (
          <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.5)", fontSize: 11, letterSpacing: "0.16em" }}>
            NO ONE'S RSVP'D YET.
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {rsvps.map(r => (
              <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.15)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{r.user?.display_name ?? r.user?.handle ?? "MEMBER"}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.14em" }}>
                    JOINED {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="e-mono" style={{ fontSize: 10, color: r.status === "paid" ? "var(--sky)" : r.status === "rsvp" ? "rgba(242,238,232,0.7)" : "var(--rose)", letterSpacing: "0.16em" }}>
                  {r.status.toUpperCase()}
                  {r.amount_paid_cents != null ? ` · $${(r.amount_paid_cents / 100).toFixed(2)}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </CoachShell>
  );
}
