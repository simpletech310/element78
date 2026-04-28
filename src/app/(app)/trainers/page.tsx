import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { listTrainers } from "@/lib/data/queries";

export default async function TrainersScreen() {
  const trainers = await listTrainers();
  const featured = trainers[0];
  const rest = trainers.slice(1);
  const filters = [{ l: "ALL", a: true }, { l: "PILATES" }, { l: "STRENGTH" }, { l: "YOGA" }, { l: "HIIT" }, { l: "1-ON-1" }];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px 6px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>FAMILY · {trainers.length} TRAINERS</div>
          <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>PICK YOUR<br/>COACH.</div>
        </div>

        <div className="no-scrollbar" style={{ padding: "14px 22px 6px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.a ? "var(--ink)" : "transparent",
              color: c.a ? "var(--bone)" : "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
              whiteSpace: "nowrap",
            }}>{c.l}</div>
          ))}
        </div>

        {featured && (
          <div style={{ padding: "14px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>★ FEATURED THIS WEEK</div>
            <Link href={`/trainers/${featured.slug}`} className="lift" style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 320, display: "block", color: "var(--bone)", textDecoration: "none" }}>
              <Photo src={featured.hero_image ?? ""} alt={featured.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95))" }} />
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
                <div className="e-mono" style={{ color: "var(--sky)" }}>{featured.specialties[0]?.toUpperCase()} · {featured.headline?.split(".")[0].toUpperCase()}</div>
                <div className="e-display" style={{ fontSize: 30, lineHeight: 0.95, marginTop: 4 }}>{featured.name.toUpperCase()}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center" }} className="e-mono">
                  <span style={{ color: "var(--sky)" }}>★ {featured.rating}</span>
                  <span style={{ opacity: 0.6 }}>14 FLOWS</span>
                  <span className="btn btn-sky" style={{ marginLeft: "auto", padding: "8px 14px" }}>VIEW</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div style={{ padding: "20px 22px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {rest.map(t => (
            <Link key={t.id} href={`/trainers/${t.slug}`} className="lift" style={{ display: "flex", gap: 14, padding: 12, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)", color: "var(--ink)", textDecoration: "none" }}>
              <div style={{ width: 64, height: 80, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                <Photo src={t.avatar_url ?? t.hero_image ?? ""} alt={t.name} style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.02em" }}>{t.name.toUpperCase()}</div>
                  <span className="e-mono" style={{ color: "var(--electric-deep)" }}>★ {t.rating}</span>
                </div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.55)", marginTop: 4 }}>{t.specialties.slice(0,2).join(" · ").toUpperCase()}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {t.specialties.slice(0,2).map(tag => (
                    <span key={tag} className="e-tag" style={{ fontSize: 9, padding: "3px 7px", borderRadius: 999, background: "rgba(143,184,214,0.18)", color: "var(--electric-deep)" }}>{tag.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
