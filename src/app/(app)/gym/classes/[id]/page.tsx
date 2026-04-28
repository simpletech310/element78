import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getClass, getTrainer } from "@/lib/data/queries";
import { listTrainers } from "@/lib/data/queries";

export default async function ClassDetail({ params }: { params: { id: string } }) {
  const c = await getClass(params.id);
  if (!c) notFound();
  const trainers = await listTrainers();
  const trainer = trainers.find(t => t.id === c.trainer_id) ?? trainers[0];
  const dt = new Date(c.starts_at);
  const dateStr = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase();
  const timeStr = `${dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} — ${new Date(dt.getTime() + c.duration_min * 60000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  const taken = [0, 2, 5, 8, 9, 11];
  const sel = 6;

  const specs = [
    { l: "INTENSITY", v: c.intensity ?? "MEDIUM" },
    { l: "CALORIES", v: "~ 380" },
    { l: "EQUIPMENT", v: c.kind?.toUpperCase() === "REFORMER" ? "REFORMER" : "MAT" },
    { l: "LEVEL", v: "OPEN" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll" style={{ paddingBottom: 110 }}>
        <div style={{ position: "relative", height: 380 }}>
          {c.hero_image && <Photo src={c.hero_image} alt={c.name} style={{ position: "absolute", inset: 0 }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,20,0.65) 0%, rgba(10,14,20,0) 30%, rgba(10,14,20,0) 50%, rgba(10,14,20,0.95) 100%)" }} />
          <div style={{ position: "absolute", top: 50, left: 22, right: 22, display: "flex", justifyContent: "space-between" }}>
            <Link href="/gym" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.6)", backdropFilter: "blur(10px)", border: "none", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={18} /></button>
            </div>
          </div>
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 18, color: "var(--bone)" }}>
            <div className="e-mono" style={{ color: "var(--sky)" }}>{c.kind?.toUpperCase()} · {c.room} · {c.duration_min} MIN</div>
            <div className="e-display" style={{ fontSize: 44, lineHeight: 0.9, marginTop: 6 }}>{c.name}</div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
            <div>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>{dateStr}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 2 }}>{timeStr}</div>
            </div>
            <Icon name="cal" size={22} />
          </div>
        </div>

        {trainer && (
          <div style={{ padding: "14px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 8 }}>WITH</div>
            <Link href={`/trainers/${trainer.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", color: "var(--ink)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden" }}>
                <Photo src={trainer.avatar_url ?? ""} alt={trainer.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{trainer.name.toUpperCase()}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2 }}>★ {trainer.rating} · 412 RATINGS · 9 YR</div>
              </div>
              <Icon name="chevron" size={18} />
            </Link>
          </div>
        )}

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>WHAT TO EXPECT</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(10,14,20,0.78)" }}>
            Slow tempo. Long holds. Built for women who want strong, soft, and unmistakable. Bring your own grip socks — towels and water on us.
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {specs.map(s => (
              <div key={s.l} style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(10,14,20,0.08)" }}>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>{s.l}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>PICK YOUR SPOT</div>
            <div className="e-mono" style={{ color: "var(--electric-deep)" }}>{c.capacity - c.booked} OPEN / {c.capacity}</div>
          </div>
          <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
            <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", textAlign: "center", marginBottom: 12 }}>— FRONT (MIRROR) —</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {Array.from({ length: c.capacity }).map((_, i) => {
                const isTaken = taken.includes(i);
                const isSel = i === sel;
                return (
                  <div key={i} style={{
                    aspectRatio: "1.3", borderRadius: 6,
                    background: isSel ? "var(--electric)" : isTaken ? "rgba(10,14,20,0.18)" : "transparent",
                    color: isSel ? "var(--ink)" : isTaken ? "rgba(10,14,20,0.4)" : "var(--ink)",
                    border: isSel ? "none" : "1px solid rgba(10,14,20,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: 10,
                  }}>{i + 1}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 22px 30px", background: "rgba(242,238,232,0.97)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(10,14,20,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>SPOT 7</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>$0 <span style={{ fontSize: 12, color: "rgba(10,14,20,0.5)" }}>· INCL.</span></div>
        </div>
        <button className="btn btn-ink" style={{ flex: 1 }}>RESERVE SPOT 7</button>
      </div>
      <HomeIndicator />
    </div>
  );
}
