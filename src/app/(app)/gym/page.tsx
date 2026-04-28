import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Wordmark } from "@/components/brand/Wordmark";
import { Photo } from "@/components/ui/Photo";
import { Icon, IconName } from "@/components/ui/Icon";
import { listClasses } from "@/lib/data/queries";

export default async function GymScreen() {
  const all = await listClasses();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayClasses = all.filter(c => {
    const d = new Date(c.starts_at);
    return d >= today && d < new Date(today.getTime() + 86400000 * 2);
  }).slice(0, 6);

  const actions: { l: string; i: IconName }[] = [
    { l: "CHECK IN", i: "qr" },
    { l: "BRING GUEST", i: "plus" },
    { l: "STUDIO MAP", i: "map" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href="/locations" className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>HQ · COMPTON</Link>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE GYM</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--sky)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="qr" size={18} />
          </button>
        </div>

        {/* Membership card */}
        <div style={{ padding: "14px 22px 6px" }}>
          <div style={{
            position: "relative", borderRadius: 22, overflow: "hidden",
            background: "linear-gradient(140deg, var(--ink) 0%, var(--haze) 60%, var(--electric-deep) 130%)",
            color: "var(--bone)", padding: 20, minHeight: 180,
          }}>
            <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(143,184,214,0.35), transparent 70%)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
              <Wordmark size={20} color="var(--bone)" />
              <span className="e-tag" style={{ background: "rgba(143,184,214,0.18)", color: "var(--sky)", padding: "4px 8px", borderRadius: 4 }}>ELITE · 24H</span>
            </div>
            <div style={{ marginTop: 32, position: "relative" }}>
              <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)" }}>MEMBER</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, marginTop: 4, letterSpacing: "0.03em" }}>NAYA OKONKWO</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, position: "relative" }}>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>ID</div>
                <div className="e-mono" style={{ marginTop: 2 }}>E78-04287</div>
              </div>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>RENEWS</div>
                <div className="e-mono" style={{ marginTop: 2 }}>05.27.26</div>
              </div>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.5)", fontSize: 9 }}>VISITS</div>
                <div className="e-mono" style={{ marginTop: 2, color: "var(--sky)" }}>12 / MO</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: "12px 22px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {actions.map(a => (
            <button key={a.l} style={{
              padding: "14px 8px", borderRadius: 12, background: "var(--paper)",
              border: "1px solid rgba(10,14,20,0.08)", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6, cursor: "pointer", color: "var(--ink)",
            }}>
              <Icon name={a.i} size={18} />
              <span className="e-mono" style={{ fontSize: 9 }}>{a.l}</span>
            </button>
          ))}
        </div>

        {/* Day strip */}
        <div style={{ padding: "20px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="e-display" style={{ fontSize: 22 }}>CLASSES</div>
          <Link href="/gym/classes" className="e-mono" style={{ color: "var(--electric-deep)" }}>SEE ALL →</Link>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, padding: "0 22px", overflowX: "auto" }}>
          {week.map((d, i) => {
            const active = i === 0;
            return (
              <div key={i} style={{
                flexShrink: 0, padding: "10px 12px", borderRadius: 12, minWidth: 50, textAlign: "center",
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--bone)" : "var(--ink)",
                border: active ? "none" : "1px solid rgba(10,14,20,0.1)",
              }}>
                <div className="e-mono" style={{ fontSize: 9, color: active ? "var(--sky)" : "rgba(10,14,20,0.5)" }}>{d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 2, letterSpacing: "0.02em" }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Class list */}
        <div style={{ padding: "16px 22px 6px", display: "flex", flexDirection: "column", gap: 10 }}>
          {todayClasses.map((c, i) => {
            const dt = new Date(c.starts_at);
            const time = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toUpperCase();
            const full = c.booked >= c.capacity;
            const booked = i === 0;
            return (
              <Link key={c.id} href={`/gym/classes/${c.id}`} style={{
                display: "flex", gap: 14, padding: 14, borderRadius: 16,
                background: booked ? "linear-gradient(135deg, rgba(143,184,214,0.18), rgba(77,169,214,0.06))" : "var(--paper)",
                border: booked ? "1px solid rgba(143,184,214,0.4)" : "1px solid rgba(10,14,20,0.06)",
                opacity: full ? 0.55 : 1, color: "var(--ink)",
              }}>
                <div style={{ width: 60, paddingRight: 12, borderRight: "1px solid rgba(10,14,20,0.1)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1 }}>{time}</div>
                  <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 4 }}>{c.duration_min}M</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1, letterSpacing: "0.02em" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(10,14,20,0.6)", marginTop: 4 }}>{c.kind?.toUpperCase()} · {c.room}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    {c.hero_image && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden" }}>
                        <Photo src={c.hero_image} alt="" style={{ width: "100%", height: "100%" }} />
                      </div>
                    )}
                    <span className="e-mono" style={{ fontSize: 9, color: full ? "#A14040" : "var(--electric-deep)" }}>
                      {full ? "· FULL · WAITLIST" : `· ${c.capacity - c.booked} SPOTS`}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {booked ? (
                    <span className="e-mono" style={{ background: "var(--sky)", color: "var(--ink)", padding: "6px 10px", borderRadius: 999, fontSize: 9 }}>BOOKED</span>
                  ) : full ? (
                    <Icon name="clock" size={20} />
                  ) : (
                    <span style={{ width: 36, height: 36, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="plus" size={16} />
                    </span>
                  )}
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
