import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { listClasses } from "@/lib/data/queries";

export default async function ClassBrowse() {
  const all = await listClasses();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { d: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(), n: d.getDate(), today: i === 0 };
  });
  const filters = [{ l: `ALL · ${all.length}`, a: true }, { l: "AM" }, { l: "PM" }, { l: "PILATES" }, { l: "STRENGTH" }, { l: "YOGA" }, { l: "OPEN SPOT" }];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>COMPTON HQ · TODAY</div>
          <div className="e-display" style={{ fontSize: 36, lineHeight: 0.95, marginTop: 4 }}>WHAT&apos;S<br/>ON THE FLOOR.</div>
        </div>

        <div className="no-scrollbar" style={{ padding: "14px 22px 4px", display: "flex", gap: 6, overflowX: "auto" }}>
          {week.map((d, i) => (
            <div key={i} style={{
              flexShrink: 0, width: 50, padding: "10px 0", borderRadius: 12,
              background: d.today ? "var(--ink)" : "transparent",
              color: d.today ? "var(--bone)" : "var(--ink)",
              border: d.today ? "none" : "1px solid rgba(10,14,20,0.12)",
              textAlign: "center",
            }}>
              <div className="e-mono" style={{ fontSize: 9, opacity: 0.6 }}>{d.d}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginTop: 4 }}>{d.n}</div>
            </div>
          ))}
        </div>

        <div className="no-scrollbar" style={{ padding: "12px 22px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap",
              background: c.a ? "var(--electric)" : "transparent",
              color: "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
            }}>{c.l}</div>
          ))}
        </div>

        <div style={{ padding: "14px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {all.map((c) => {
            const dt = new Date(c.starts_at);
            const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toUpperCase();
            const full = c.booked >= c.capacity;
            return (
              <Link key={c.id} href={`/gym/classes/${c.id}`} style={{ display: "flex", borderRadius: 16, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", overflow: "hidden", opacity: full ? 0.65 : 1, color: "var(--ink)" }}>
                <div style={{ width: 70, padding: "14px 0", textAlign: "center", background: "var(--ink)", color: "var(--bone)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{time}</div>
                  <div className="e-mono" style={{ fontSize: 8, color: "rgba(242,238,232,0.5)", marginTop: 4 }}>{c.duration_min}M</div>
                </div>
                <div style={{ width: 80, position: "relative" }}>
                  {c.hero_image && <Photo src={c.hero_image} alt="" style={{ position: "absolute", inset: 0 }} />}
                </div>
                <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 9 }}>{c.kind?.toUpperCase()}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.05, marginTop: 4 }}>{c.name}</div>
                    <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.55)", marginTop: 6 }}>{c.intensity ?? "MD"} · {c.room ?? ""}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span className="e-mono" style={{ fontSize: 9, color: full ? "rgba(10,14,20,0.5)" : "var(--ink)" }}>
                      {full ? "· WAITLIST" : `· ${c.capacity - c.booked} SPOTS`}
                    </span>
                    <span style={{
                      padding: "6px 12px", borderRadius: 999,
                      background: full ? "transparent" : "var(--ink)",
                      color: full ? "var(--ink)" : "var(--bone)",
                      border: full ? "1px solid rgba(10,14,20,0.2)" : "none",
                      fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em",
                    }}>{full ? "JOIN LIST" : "RESERVE"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
