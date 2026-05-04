import Link from "next/link";
import { TabBar } from "@/components/chrome/TabBar";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { listActiveChallenges } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function ChallengesIndex() {
  const challenges = await listActiveChallenges();

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingTop: 20, paddingBottom: 100 }}>
        <div style={{ padding: "10px 22px 6px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>FAMILY · CHALLENGES</div>
          <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>JUMP IN.</div>
        </div>

        <div style={{ padding: "16px 22px 4px", display: "flex", flexDirection: "column", gap: 14 }}>
          {challenges.length === 0 ? (
            <div style={{ padding: "40px 14px", textAlign: "center", borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
              <div className="e-display" style={{ fontSize: 18 }}>NO ACTIVE CHALLENGES</div>
              <div className="e-mono" style={{ fontSize: 11, color: "rgba(10,14,20,0.5)", marginTop: 6 }}>CHECK BACK SOON.</div>
            </div>
          ) : (
            challenges.map(c => {
              const days = Math.max(0, Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              return (
                <Link
                  key={c.id}
                  href={`/challenges/${c.slug}`}
                  style={{ display: "block", borderRadius: 18, overflow: "hidden", background: "var(--ink)", color: "var(--bone)", position: "relative", height: 200, textDecoration: "none" }}
                >
                  {c.hero_image && <Photo src={c.hero_image} alt="" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,127,176,0.7), rgba(10,14,20,0.85))" }} />
                  <div style={{ position: "absolute", inset: 0, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 3, alignSelf: "flex-start" }}>
                      CHALLENGE · {days} DAY{days === 1 ? "" : "S"} LEFT
                    </span>
                    <div>
                      <div className="e-display" style={{ fontSize: 28, lineHeight: 0.95 }}>{c.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                        <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10 }}>{c.enrollment_count} IN · {c.completion_count} DONE</div>
                        <div style={{ flex: 1 }} />
                        <span className="btn btn-sky" style={{ padding: "8px 14px" }}>OPEN</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
