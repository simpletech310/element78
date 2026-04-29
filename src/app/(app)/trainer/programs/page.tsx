import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { CoachShell, CoachEmpty } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listProgramsAuthoredBy } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function CoachProgramsListPage({ searchParams }: { searchParams: { archived?: string; error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/programs");

  const programs = await listProgramsAuthoredBy(coach.id);
  const flash = searchParams.archived ? "PROGRAM ARCHIVED" : searchParams.error ? `ERROR: ${searchParams.error}` : null;

  return (
    <CoachShell coach={coach} pathname="/trainer/programs">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>YOUR PROGRAMS.</h1>
        <Link href="/trainer/programs/new" className="btn btn-sky" style={{ padding: "12px 22px" }}>+ NEW PROGRAM</Link>
      </div>

      {flash && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
          ✓ {flash}
        </div>
      )}

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
        {programs.length === 0 ? (
          <CoachEmpty body="No programs yet. Tap + NEW PROGRAM to author your first one." />
        ) : (
          programs.map(p => (
            <Link
              key={p.id}
              href={`/trainer/programs/${p.id}`}
              className="lift"
              style={{
                display: "flex", gap: 14, padding: 18, borderRadius: 14,
                background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none",
                opacity: p.status === "archived" ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
                  {(p.status ?? "published").toUpperCase()} · {p.duration_label ?? "—"} · {p.total_sessions} SESSIONS
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 8, letterSpacing: "0.02em" }}>
                  {p.name}
                </div>
                {p.subtitle && (
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.14em", marginTop: 6 }}>
                    {p.subtitle}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>EDIT →</span>
                <Icon name="chevron" size={18} />
              </div>
            </Link>
          ))
        )}
      </div>
    </CoachShell>
  );
}
