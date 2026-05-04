import Link from "next/link";
import type { TrainerSessionRow, Trainer } from "@/lib/data/types";
import { fmtDollars } from "@/lib/format";

type RailItem = {
  session: TrainerSessionRow;
  attendees: number;
  trainer: Pick<Trainer, "id" | "slug" | "name" | "avatar_url">;
};

export function GroupSessionRail({ items, theme = "light" }: { items: RailItem[]; theme?: "light" | "dark" }) {
  if (items.length === 0) return null;

  const isDark = theme === "dark";
  const cardBg = isDark
    ? "linear-gradient(135deg, rgba(143,184,214,0.16), rgba(46,127,176,0.04))"
    : "var(--paper)";
  const cardBorder = isDark ? "1px solid rgba(143,184,214,0.32)" : "1px solid rgba(10,14,20,0.08)";
  const cardColor = isDark ? "var(--bone)" : "var(--ink)";
  const accent = isDark ? "var(--sky)" : "var(--electric-deep)";
  const muted = isDark ? "rgba(242,238,232,0.6)" : "rgba(10,14,20,0.55)";

  return (
    <div style={{ padding: "20px 22px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div className="e-display" style={{ fontSize: 22, color: cardColor }}>GROUP SESSIONS</div>
          <div className="e-mono" style={{ color: muted, fontSize: 9, marginTop: 2, letterSpacing: "0.18em" }}>
            {items.length} OPEN · LIVE WITH A COACH
          </div>
        </div>
        <Link href="/train/groups" className="e-mono" style={{ color: accent, fontSize: 10, letterSpacing: "0.2em", textDecoration: "none" }}>
          SEE ALL →
        </Link>
      </div>
      <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {items.map(({ session, attendees, trainer }) => {
          const dt = new Date(session.starts_at);
          const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
          const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          const seatsLeft = Math.max(0, session.capacity - attendees);
          return (
            <Link
              key={session.id}
              href={`/trainers/${trainer.slug}/book#group-${session.id}`}
              className="lift"
              style={{
                flexShrink: 0, width: 240, padding: 14, borderRadius: 16,
                background: cardBg, border: cardBorder,
                color: cardColor, textDecoration: "none",
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="e-mono" style={{ color: accent, fontSize: 9, letterSpacing: "0.2em" }}>{dateStr}</div>
                <div className="e-mono" style={{ color: muted, fontSize: 9, letterSpacing: "0.18em" }}>
                  {session.mode === "video" ? "VIDEO" : "IN PERSON"}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, lineHeight: 0.95 }}>{timeStr}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 15, lineHeight: 1.1, letterSpacing: "0.02em" }}>
                {(session.title ?? "GROUP SESSION").toUpperCase()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
                  background: isDark ? "rgba(143,184,214,0.18)" : "var(--haze)",
                  backgroundImage: trainer.avatar_url ? `url(${trainer.avatar_url})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                  border: isDark ? "1px solid rgba(143,184,214,0.3)" : "1px solid rgba(10,14,20,0.12)",
                  flexShrink: 0,
                }} />
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {trainer.name.toUpperCase()}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", gap: 8 }}>
                <span className="e-mono" style={{
                  fontSize: 9, padding: "4px 9px", borderRadius: 999, letterSpacing: "0.18em",
                  background: isDark ? "rgba(143,184,214,0.14)" : "rgba(46,127,176,0.1)",
                  color: accent,
                }}>
                  {seatsLeft} {seatsLeft === 1 ? "SEAT" : "SEATS"} LEFT
                </span>
                <span className="e-mono" style={{ fontSize: 11, color: cardColor, fontFamily: "var(--font-display)" }}>
                  {session.price_cents > 0 ? fmtDollars(session.price_cents) : "FREE"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
