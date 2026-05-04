import { notFound } from "next/navigation";
import { TabBar } from "@/components/chrome/TabBar";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { getUser } from "@/lib/auth";
import { getChallenge, listChallengeLeaderboard } from "@/lib/data/queries";
import { joinChallengeAction, leaveChallengeAction } from "@/lib/challenge-actions";
import { TaskList } from "./_components/TaskList";

export const dynamic = "force-dynamic";

export default async function ChallengeDetail({ params }: { params: { slug: string } }) {
  const user = await getUser();
  const detail = await getChallenge(params.slug, user?.id ?? null);
  if (!detail) notFound();
  const { challenge, tasks, myEnrollment, myCompletions } = detail;
  const leaderboard = await listChallengeLeaderboard(challenge.id);

  const enrolled = !!myEnrollment;
  const doneIds = myCompletions.map(c => c.task_id);
  const myDone = doneIds.length;
  const total = tasks.length;
  const allDone = total > 0 && myDone >= total;

  const now = Date.now();
  const startsAt = new Date(challenge.starts_at).getTime();
  const endsAt = new Date(challenge.ends_at).getTime();
  const ended = now > endsAt;
  const daysLeft = Math.max(0, Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={!!user} />
      <div className="app-scroll" style={{ paddingTop: 20, paddingBottom: 100 }}>
        <div style={{ padding: "0 22px 10px" }}>
          <div style={{ borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", position: "relative", minHeight: 240 }}>
            {challenge.hero_image && <Photo src={challenge.hero_image} alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.7), rgba(10,14,20,0.85))" }} />
            <div style={{ position: "relative", padding: 22, display: "flex", flexDirection: "column", gap: 16, minHeight: 240 }}>
              <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3, alignSelf: "flex-start" }}>
                {ended ? "ENDED" : `CHALLENGE · ${daysLeft} DAY${daysLeft === 1 ? "" : "S"} LEFT`}
              </span>
              <div>
                <div className="e-display" style={{ fontSize: 32, lineHeight: 0.95 }}>{challenge.title}</div>
                {challenge.subtitle && <div style={{ marginTop: 8, color: "rgba(255,255,255,0.78)" }}>{challenge.subtitle}</div>}
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>{challenge.enrollment_count} IN · {challenge.completion_count} FINISHED</div>
                <div style={{ flex: 1 }} />
                {!user ? (
                  <a href={`/login?next=/challenges/${challenge.slug}`} className="btn btn-sky" style={{ padding: "8px 14px" }}>SIGN IN TO JOIN</a>
                ) : !enrolled ? (
                  <form action={joinChallengeAction}>
                    <input type="hidden" name="challenge_id" value={challenge.id} />
                    <input type="hidden" name="slug" value={challenge.slug} />
                    <button type="submit" className="btn btn-sky" style={{ padding: "8px 14px" }}>I'M IN</button>
                  </form>
                ) : allDone ? (
                  <span className="btn" style={{ padding: "8px 14px", background: "var(--sky)", color: "var(--ink)" }}>✓ COMPLETED</span>
                ) : (
                  <form action={leaveChallengeAction}>
                    <input type="hidden" name="challenge_id" value={challenge.id} />
                    <input type="hidden" name="slug" value={challenge.slug} />
                    <button type="submit" className="e-tag" style={{ padding: "8px 12px", borderRadius: 999, background: "transparent", color: "var(--bone)", border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer" }}>LEAVE</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {challenge.description && (
          <div style={{ padding: "10px 22px", fontSize: 14, lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
            {challenge.description}
          </div>
        )}

        <div style={{ padding: "10px 22px 6px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 11, letterSpacing: "0.18em" }}>
            TASKS · {myDone}/{total}
          </div>
          <div style={{ marginTop: 12 }}>
            <TaskList
              challengeId={challenge.id}
              slug={challenge.slug}
              tasks={tasks}
              initialDoneIds={doneIds}
              enrolled={enrolled}
            />
            {!enrolled && (
              <div className="e-mono" style={{ marginTop: 10, fontSize: 10, color: "rgba(10,14,20,0.5)", letterSpacing: "0.16em" }}>
                JOIN TO TICK THESE OFF.
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "20px 22px 6px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 11, letterSpacing: "0.18em" }}>
            LEADERBOARD · {leaderboard.length}
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {leaderboard.length === 0 ? (
              <div className="e-mono" style={{ fontSize: 11, color: "rgba(10,14,20,0.5)", letterSpacing: "0.16em" }}>BE THE FIRST IN.</div>
            ) : (
              leaderboard.map(row => {
                const isPodium = ended && row.rank !== null && row.rank <= 3;
                const podiumLabel = row.rank === 1 ? "1ST" : row.rank === 2 ? "2ND" : row.rank === 3 ? "3RD" : null;
                return (
                  <div key={row.user.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 12, background: isPodium ? "var(--ink)" : "var(--paper)", color: isPodium ? "var(--bone)" : "var(--ink)", border: "1px solid rgba(10,14,20,0.06)" }}>
                    <div style={{ width: 28, fontFamily: "var(--font-display)", fontSize: 16, color: isPodium ? "var(--sky)" : "rgba(10,14,20,0.5)" }}>
                      {row.rank ? `#${row.rank}` : "—"}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(10,14,20,0.08)" }}>
                      {row.user.avatar_url && <Photo src={row.user.avatar_url} alt="" style={{ width: "100%", height: "100%" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>
                        {(row.user.display_name ?? row.user.handle ?? "MEMBER").toUpperCase()}
                        {podiumLabel && <span className="e-tag" style={{ marginLeft: 8, background: "var(--sky)", color: "var(--ink)", padding: "2px 6px", borderRadius: 3, fontSize: 9 }}>{podiumLabel}</span>}
                      </div>
                      <div className="e-mono" style={{ fontSize: 9, color: isPodium ? "rgba(255,255,255,0.55)" : "rgba(10,14,20,0.5)", letterSpacing: "0.14em", marginTop: 2 }}>
                        {row.completed_at
                          ? `DONE ${new Date(row.completed_at).toLocaleDateString()}`
                          : `${row.tasks_done}/${row.tasks_total} TASKS`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}
