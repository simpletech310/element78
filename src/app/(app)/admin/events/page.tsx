import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { cancelEventAction } from "@/lib/admin-actions";
import type { EventRow } from "@/lib/data/types";

export const dynamic = "force-dynamic";

type Row = EventRow & {
  author: { name: string; slug: string } | null;
  location: { name: string } | null;
};

export default async function AdminEventsPage({ searchParams }: { searchParams: { cancelled?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/events");
  const sb = createClient();
  const { data } = await sb
    .from("events")
    .select("*, author:trainers!events_author_trainer_id_fkey(name, slug), location:locations!events_location_id_fkey(name)")
    .order("starts_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  return (
    <AdminShell pathname="/admin/events" title="EVENTS" subtitle={`${rows.length} TOTAL · ALL GYMS`}>
      {searchParams.cancelled && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          EVENT CANCELLED.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(e => (
          <div key={e.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", color: "var(--bone)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{e.title}</div>
              <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                {new Date(e.starts_at).toLocaleString()} · {e.location?.name ?? "—"} · BY {e.author?.name ? e.author.name.toUpperCase() : "—"}
              </div>
            </div>
            <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,238,232,0.7)" }}>
              {e.price_cents > 0 ? `$${(e.price_cents / 100).toFixed(0)} · ${e.paid_count} PAID` : `FREE · ${e.rsvp_count} RSVP`}
            </div>
            <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: e.status === "published" ? "var(--sky)" : e.status === "cancelled" ? "var(--rose)" : "rgba(242,238,232,0.5)" }}>
              {e.status.toUpperCase()}
            </div>
            {e.status !== "cancelled" && (
              <form action={cancelEventAction}>
                <input type="hidden" name="event_id" value={e.id} />
                <button type="submit" className="e-tag" style={{ padding: "6px 10px", borderRadius: 999, background: "transparent", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", cursor: "pointer", fontSize: 9 }}>CANCEL</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
