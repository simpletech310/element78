import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listProgramsAuthoredBy } from "@/lib/data/queries";

export default async function TrainerProgramsListPage({ searchParams }: { searchParams: { archived?: string; error?: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/programs");

  const programs = await listProgramsAuthoredBy(trainer.id);
  const flash = searchParams.archived ? "PROGRAM ARCHIVED" : searchParams.error ? `ERROR: ${searchParams.error}` : null;

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
            <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>YOUR PROGRAMS.</h1>
          </div>
          <Link href="/trainer/programs/new" className="btn btn-sky" style={{ padding: "10px 18px" }}>+ NEW PROGRAM</Link>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {programs.length === 0 ? (
            <div style={{ padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
              No programs yet. Build your first by clicking <Link href="/trainer/programs/new" className="e-mono" style={{ color: "var(--sky)" }}>+ NEW PROGRAM</Link>.
            </div>
          ) : (
            programs.map(p => (
              <Link
                key={p.id}
                href={`/trainer/programs/${p.id}`}
                className="lift"
                style={{
                  display: "flex", gap: 14, padding: 14, borderRadius: 14,
                  background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                  color: "var(--bone)", textDecoration: "none",
                  opacity: p.status === "archived" ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="e-mono" style={{ color: "var(--sky)", fontSize: 9, letterSpacing: "0.2em" }}>
                    {(p.status ?? "published").toUpperCase()} · {p.duration_label ?? "—"} · {p.total_sessions} SESSIONS
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 6, letterSpacing: "0.02em" }}>
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
      </div>
    </div>
  );
}
