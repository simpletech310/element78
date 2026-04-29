import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listAllClassesByTrainer } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/data/types";

export default async function TrainerClassesPage({ searchParams }: { searchParams: { cancelled?: string; completed?: string; error?: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/classes");

  const classes = await listAllClassesByTrainer(trainer.id);

  // Booking counts per class so the row can show (X/Y).
  const sb = createClient();
  const ids = classes.map(c => c.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: bs } = await sb.from("bookings").select("class_id, status").in("class_id", ids).in("status", ["confirmed", "pending"]);
    for (const r of (bs as Array<{ class_id: string; status: string }>) ?? []) {
      counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
    }
  }

  const now = Date.now();
  const upcoming = classes.filter(c => new Date(c.starts_at).getTime() >= now && (c.status ?? "scheduled") !== "cancelled");
  const past = classes.filter(c => new Date(c.starts_at).getTime() < now || (c.status ?? "scheduled") !== "scheduled");
  // The same class won't appear twice — `past` only catches rows that are
  // either before now OR already cancelled/completed.

  const flash = searchParams.cancelled ? "CLASS CANCELLED · ATTENDEES REFUNDED"
              : searchParams.completed ? "CLASS COMPLETED · LOGGED TO ATTENDEE HISTORY"
              : searchParams.error ? `ERROR: ${searchParams.error.replace(/_/g, " ").toUpperCase()}`
              : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>TRAINER · {trainer.name.toUpperCase()}</div>
            <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>YOUR CLASSES.</h1>
          </div>
          <Link href="/trainer/classes/new" className="btn btn-sky" style={{ padding: "10px 18px" }}>+ NEW CLASS</Link>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: searchParams.error ? "rgba(232,181,168,0.12)" : "rgba(143,184,214,0.1)", border: `1px solid ${searchParams.error ? "var(--rose)" : "var(--sky)"}`, color: searchParams.error ? "var(--rose)" : "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        <Section title={`UPCOMING · ${upcoming.length}`}>
          {upcoming.length === 0 ? (
            <Empty body="No upcoming classes. Create one with + NEW CLASS." />
          ) : (
            upcoming.map(c => <ClassCard key={c.id} cls={c} booked={counts.get(c.id) ?? 0} />)
          )}
        </Section>

        <Section title={`PAST · ${past.length}`}>
          {past.length === 0 ? (
            <Empty body="No past classes yet." />
          ) : (
            past.slice(0, 30).map(c => <ClassCard key={c.id} cls={c} booked={counts.get(c.id) ?? 0} dim />)
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32 }}>
      <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>{title}</div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </section>
  );
}

function ClassCard({ cls, booked, dim }: { cls: ClassRow; booked: number; dim?: boolean }) {
  const dt = new Date(cls.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const status = cls.status ?? "scheduled";
  const statusColor = status === "completed" ? "var(--sky)" : status === "cancelled" ? "var(--rose)" : "rgba(242,238,232,0.55)";
  return (
    <Link href={`/trainer/classes/${cls.id}`} className="lift" style={{
      display: "flex", gap: 14, padding: 14, borderRadius: 14,
      background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
      color: "var(--bone)", textDecoration: "none",
      opacity: dim ? 0.65 : 1, alignItems: "center", flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 96, paddingRight: 14, borderRight: "1px solid rgba(143,184,214,0.18)" }}>
        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, marginTop: 4 }}>{timeStr}</div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{cls.name.toUpperCase()}</div>
        <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.18em", marginTop: 6 }}>
          {(cls.kind ?? "—").toUpperCase()} · {booked}/{cls.capacity} BOOKED · {cls.duration_min}M
        </div>
      </div>
      <div className="e-mono" style={{ color: statusColor, fontSize: 10, letterSpacing: "0.2em" }}>
        {status.toUpperCase()}
      </div>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div style={{ padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>{body}</div>
  );
}
