import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { searchAll } from "@/lib/data/queries";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const results = q ? await searchAll(q) : { trainers: [], programs: [], classes: [] };
  const totalHits = results.trainers.length + results.programs.length + results.classes.length;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/home" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>HOME</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>SEARCH</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>FIND.</h1>
        </div>

        <form method="get" style={{ marginTop: 22 }}>
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="reformer, kai, recovery…"
            style={{ width: "100%", padding: "14px 18px", borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.25)", color: "var(--bone)", fontFamily: "var(--font-body)", fontSize: 16 }}
          />
        </form>

        {q && totalHits === 0 && (
          <div style={{ marginTop: 28, padding: "18px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>
            Nothing matches "{q}". Try a different keyword.
          </div>
        )}

        {results.trainers.length > 0 && (
          <Section title={`COACHES · ${results.trainers.length}`}>
            {results.trainers.map(t => (
              <Link key={t.id} href={`/trainers/${t.slug}`} className="lift" style={{
                display: "block", padding: 14, borderRadius: 12,
                background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none",
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{t.name.toUpperCase()}</div>
                {t.headline && <div style={{ marginTop: 4, fontSize: 13, color: "rgba(242,238,232,0.7)" }}>{t.headline}</div>}
              </Link>
            ))}
          </Section>
        )}

        {results.programs.length > 0 && (
          <Section title={`PROGRAMS · ${results.programs.length}`}>
            {results.programs.map(p => (
              <Link key={p.id} href={`/programs/${p.slug}`} className="lift" style={{
                display: "block", padding: 14, borderRadius: 12,
                background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none",
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{p.name.toUpperCase()}</div>
                {p.subtitle && <div style={{ marginTop: 4, fontSize: 13, color: "rgba(242,238,232,0.7)" }}>{p.subtitle}</div>}
              </Link>
            ))}
          </Section>
        )}

        {results.classes.length > 0 && (
          <Section title={`UPCOMING CLASSES · ${results.classes.length}`}>
            {results.classes.map(c => (
              <Link key={c.id} href={`/classes/${c.id}`} className="lift" style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: 14, borderRadius: 12,
                background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                color: "var(--bone)", textDecoration: "none", flexWrap: "wrap", gap: 6,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{c.name.toUpperCase()}</div>
                  <div className="e-mono" style={{ marginTop: 4, color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.16em" }}>
                    {(c.kind ?? "—").toUpperCase()} · {new Date(c.starts_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }).toUpperCase()} {new Date(c.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </Link>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.2em" }}>{title}</div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}
