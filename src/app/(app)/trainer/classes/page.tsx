import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listAllClassesByTrainer } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import { fmtDurationMin } from "@/lib/format";
import type { ClassRow } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export default async function CoachClassesPage({ searchParams }: { searchParams: { cancelled?: string; completed?: string; error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/classes");

  const classes = await listAllClassesByTrainer(coach.id);

  const sb = createClient();
  const ids = classes.map(c => c.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: bs } = await sb.from("bookings").select("class_id, status").in("class_id", ids).in("status", ["confirmed", "pending", "reserved"]);
    for (const r of (bs as Array<{ class_id: string; status: string }>) ?? []) {
      counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
    }
  }

  const now = Date.now();
  const upcoming = classes.filter(c => new Date(c.starts_at).getTime() >= now && (c.status ?? "scheduled") !== "cancelled");
  const past = classes.filter(c => new Date(c.starts_at).getTime() < now || (c.status ?? "scheduled") !== "scheduled");

  const flash = searchParams.cancelled ? "CLASS CANCELLED · ATTENDEES REFUNDED"
              : searchParams.completed ? "CLASS COMPLETED · LOGGED TO ATTENDEE HISTORY"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/classes">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>YOUR CLASSES.</h1>
        <Link href="/trainer/classes/new" className="btn btn-sky" style={{ padding: "12px 22px" }}>+ NEW CLASS</Link>
      </div>

      {flash && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          ✓ {flash}
        </div>
      )}

      <CoachSection title={`UPCOMING · ${upcoming.length}`}>
        {upcoming.length === 0 ? (
          <CoachEmpty body="No upcoming classes. Tap + NEW CLASS to add one." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map(c => <ClassCard key={c.id} cls={c} booked={counts.get(c.id) ?? 0} />)}
          </div>
        )}
      </CoachSection>

      <CoachSection title={`PAST · ${past.length}`}>
        {past.length === 0 ? (
          <CoachEmpty body="No past classes yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {past.slice(0, 30).map(c => <ClassCard key={c.id} cls={c} booked={counts.get(c.id) ?? 0} dim />)}
          </div>
        )}
      </CoachSection>
    </CoachShell>
  );
}

function ClassCard({ cls, booked, dim }: { cls: ClassRow; booked: number; dim?: boolean }) {
  const status = cls.status ?? "scheduled";
  const statusColor = status === "completed" ? "var(--sky)" : status === "cancelled" ? "var(--rose)" : "rgba(242,238,232,0.55)";
  return (
    <Link href={`/trainer/classes/${cls.id}`} className="lift" style={{
      display: "flex", gap: 14, padding: 16, borderRadius: 14,
      background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
      color: "var(--bone)", textDecoration: "none",
      opacity: dim ? 0.65 : 1, alignItems: "center", flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 110, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
          <Time iso={cls.starts_at} format="date" />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1, marginTop: 6 }}>
          <Time iso={cls.starts_at} format="time" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{cls.name.toUpperCase()}</div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {(cls.kind ?? "—").toUpperCase()} · {booked}/{cls.capacity} BOOKED · {fmtDurationMin(cls.duration_min)}
        </div>
      </div>
      <div className="e-mono" style={{ color: statusColor, fontSize: 10, letterSpacing: "0.2em" }}>
        {status.toUpperCase()}
      </div>
      <Icon name="chevron" size={18} />
    </Link>
  );
}
