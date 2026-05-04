import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Icon } from "@/components/ui/Icon";
import { listAllOpenGroupSessions } from "@/lib/data/queries";
import { fmtDollars, fmtDurationMin } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainGroupsScreen() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const items = await listAllOpenGroupSessions(now.toISOString(), windowEnd.toISOString());

  // Group by day-key for cleaner browsing.
  const byDay = new Map<string, typeof items>();
  for (const item of items) {
    const key = new Date(item.session.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
    const arr = byDay.get(key) ?? [];
    arr.push(item);
    byDay.set(key, arr);
  }

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href="/train" className="e-mono" style={{ color: "rgba(10,14,20,0.5)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={14} /></span>
              TRAIN
            </Link>
            <div className="e-display" style={{ fontSize: 36, marginTop: 4 }}>GROUP SESSIONS</div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", fontSize: 10, letterSpacing: "0.18em", marginTop: 4 }}>
              {items.length} OPEN · NEXT 30 DAYS
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "60px 22px" }}>
            <div className="e-mono" style={{ color: "var(--electric-deep)", letterSpacing: "0.2em", fontSize: 10 }}>
              NOTHING ON THE BOARD
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "rgba(10,14,20,0.6)", maxWidth: 460, lineHeight: 1.6 }}>
              No coaches have open group sessions in the next 30 days. Book a 1-on-1 with a coach instead, or check back soon.
            </p>
            <Link href="/trainers" className="btn btn-sky" style={{ marginTop: 18, display: "inline-block", padding: "12px 22px" }}>
              BROWSE COACHES →
            </Link>
          </div>
        ) : (
          <div style={{ padding: "16px 22px 8px", display: "flex", flexDirection: "column", gap: 22 }}>
            {Array.from(byDay.entries()).map(([day, dayItems]) => (
              <div key={day}>
                <div className="e-mono" style={{ color: "var(--electric-deep)", letterSpacing: "0.2em", fontSize: 10, marginBottom: 10 }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayItems.map(({ session, attendees, trainer }) => {
                    const dt = new Date(session.starts_at);
                    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    const seatsLeft = Math.max(0, session.capacity - attendees);
                    const durationMin = Math.round((new Date(session.ends_at).getTime() - dt.getTime()) / 60_000);
                    return (
                      <Link
                        key={session.id}
                        href={`/trainers/${trainer.slug}/book#group-${session.id}`}
                        className="lift"
                        style={{
                          display: "flex", gap: 14, padding: 14, borderRadius: 14,
                          background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)",
                          color: "var(--ink)", textDecoration: "none", alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 80, paddingRight: 14, borderRight: "1px solid rgba(10,14,20,0.08)" }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1 }}>{timeStr}</div>
                          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 9, letterSpacing: "0.18em", marginTop: 4 }}>
                            {fmtDurationMin(durationMin)}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.05, letterSpacing: "0.02em" }}>
                            {(session.title ?? "GROUP SESSION").toUpperCase()}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: "50%", overflow: "hidden",
                              background: "var(--haze)",
                              backgroundImage: trainer.avatar_url ? `url(${trainer.avatar_url})` : undefined,
                              backgroundSize: "cover", backgroundPosition: "center",
                              border: "1px solid rgba(10,14,20,0.12)", flexShrink: 0,
                            }} />
                            <div className="e-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(10,14,20,0.6)" }}>
                              {trainer.name.toUpperCase()} · {session.mode === "video" ? "VIDEO" : "IN PERSON"} · {seatsLeft} {seatsLeft === 1 ? "SEAT" : "SEATS"} LEFT
                            </div>
                          </div>
                          {session.description && (
                            <p style={{ marginTop: 8, fontSize: 12, color: "rgba(10,14,20,0.6)", lineHeight: 1.5 }}>{session.description}</p>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <span className="e-mono" style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 999, letterSpacing: "0.18em",
                            background: "var(--ink)", color: "var(--sky)",
                          }}>
                            {session.price_cents > 0 ? fmtDollars(session.price_cents) : "FREE"}
                          </span>
                          <span className="e-mono" style={{ fontSize: 9, color: "var(--electric-deep)", letterSpacing: "0.18em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            JOIN <Icon name="arrowUpRight" size={12} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
