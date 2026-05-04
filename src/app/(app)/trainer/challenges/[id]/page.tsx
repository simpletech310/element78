import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getChallengeForCoach, listChallengeLeaderboard } from "@/lib/data/queries";
import { publishChallengeAction } from "@/lib/coach-actions";

export const dynamic = "force-dynamic";

export default async function CoachChallengeDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { published?: string };
}) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/challenges");
  const detail = await getChallengeForCoach(params.id);
  if (!detail || detail.challenge.author_trainer_id !== coach.id) redirect("/trainer/challenges?error=not_found");
  const { challenge, tasks } = detail;
  const leaderboard = await listChallengeLeaderboard(challenge.id);

  return (
    <CoachShell coach={coach} pathname="/trainer/challenges">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>CHALLENGE · {challenge.status.toUpperCase()}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(32px, 7vw, 52px)", lineHeight: 0.92, marginTop: 8 }}>{challenge.title}</h1>
          {challenge.subtitle && <div style={{ marginTop: 8, color: "rgba(242,238,232,0.7)" }}>{challenge.subtitle}</div>}
          <div className="e-mono" style={{ marginTop: 8, fontSize: 10, letterSpacing: "0.16em", color: "rgba(242,238,232,0.5)" }}>
            {new Date(challenge.starts_at).toLocaleDateString()} → {new Date(challenge.ends_at).toLocaleDateString()}
          </div>
        </div>
        {challenge.status !== "published" ? (
          <form action={publishChallengeAction}>
            <input type="hidden" name="challenge_id" value={challenge.id} />
            <button type="submit" className="btn btn-sky" style={{ padding: "10px 18px" }}>PUBLISH →</button>
          </form>
        ) : (
          <Link href={`/challenges/${challenge.slug}`} className="btn btn-ink" style={{ padding: "10px 18px" }}>VIEW PUBLIC →</Link>
        )}
      </div>

      {searchParams.published && (
        <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          PUBLISHED · WALL POST CREATED.
        </div>
      )}

      <Section title="TASKS">
        <ol style={{ marginTop: 8, paddingLeft: 22, color: "var(--bone)", lineHeight: 1.8, fontSize: 14 }}>
          {tasks.map(t => <li key={t.id}>{t.label}</li>)}
        </ol>
      </Section>

      <Section title={`MEMBERS · ${leaderboard.length}`}>
        {leaderboard.length === 0 ? (
          <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.5)", fontSize: 11, letterSpacing: "0.16em" }}>
            NO ONE'S JOINED YET.
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {leaderboard.map((row, i) => (
              <div key={row.user.id + String(i)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.15)" }}>
                <div className="e-mono" style={{ width: 28, fontSize: 10, color: row.rank ? "var(--sky)" : "rgba(242,238,232,0.4)", letterSpacing: "0.16em" }}>
                  {row.rank ? `#${row.rank}` : "—"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{row.user.display_name ?? row.user.handle ?? "MEMBER"}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.14em" }}>
                    {row.completed_at
                      ? `DONE ${new Date(row.completed_at).toLocaleString()}`
                      : `${row.tasks_done}/${row.tasks_total} TASKS`}
                  </div>
                </div>
                <div className="e-mono" style={{ fontSize: 10, color: row.completed_at ? "var(--sky)" : "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>
                  {row.completed_at ? "COMPLETED" : "IN PROGRESS"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </CoachShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
      <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(242,238,232,0.6)" }}>{title}</div>
      {children}
    </section>
  );
}
