import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { listChallengesByTrainer } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function TrainerChallengesPage() {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/challenges");
  const challenges = await listChallengesByTrainer(coach.id);

  return (
    <CoachShell coach={coach} pathname="/trainer/challenges">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>YOUR CHALLENGES</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>RALLY THE FAMILY.</h1>
        </div>
        <Link href="/trainer/challenges/new" className="btn btn-sky" style={{ padding: "10px 18px" }}>+ NEW CHALLENGE</Link>
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
        {challenges.length === 0 ? (
          <div className="e-mono" style={{ padding: 28, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", color: "rgba(242,238,232,0.55)", fontSize: 11, letterSpacing: "0.18em" }}>
            NO CHALLENGES YET. CREATE ONE TO GET MEMBERS HYPED.
          </div>
        ) : (
          challenges.map(c => {
            const active = c.status === "published" && new Date(c.ends_at) > new Date();
            return (
              <Link
                key={c.id}
                href={`/trainer/challenges/${c.id}`}
                style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", textDecoration: "none", color: "var(--bone)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{c.title}</div>
                  <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                    {new Date(c.starts_at).toLocaleDateString()} → {new Date(c.ends_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: active ? "var(--sky)" : "rgba(242,238,232,0.5)" }}>
                  {c.status.toUpperCase()}
                </div>
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,238,232,0.65)" }}>
                  {c.enrollment_count} JOINED · {c.completion_count} DONE
                </div>
              </Link>
            );
          })
        )}
      </div>
    </CoachShell>
  );
}
