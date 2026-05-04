import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

const cols: { h: string; items: { label: string; href: string }[] }[] = [
  {
    h: "GYM",
    items: [
      { label: "Atlanta", href: "/atlanta" },
      { label: "Membership", href: "/membership" },
      { label: "Classes", href: "/classes" },
    ],
  },
  {
    h: "STUDIO",
    items: [
      { label: "Studio Sessions", href: "/train" },
      { label: "Programs", href: "/programs" },
      { label: "Coaches", href: "/trainers" },
      { label: "Live Classes", href: "/classes" },
    ],
  },
  {
    h: "STORE",
    items: [
      { label: "Apparel", href: "/shop" },
      { label: "Bottles", href: "/shop" },
      { label: "Fuel", href: "/shop" },
      { label: "Gift Cards", href: "/shop" },
    ],
  },
  {
    h: "CO.",
    items: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Locations", href: "/locations" },
      { label: "Careers", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer style={{ padding: "60px 22px 40px", background: "var(--ink)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Link href="/" aria-label="Element 78 home" style={{ display: "inline-block", textDecoration: "none" }}>
          <Wordmark size={32} color="var(--sky-soft)" />
        </Link>
        <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.55)", maxWidth: 320, fontWeight: 300 }}>
          78 ways to be in your element.
        </p>

        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 28, fontSize: 13 }}>
          {cols.map(c => (
            <div key={c.h}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 10, letterSpacing: "0.2em" }}>{c.h}</div>
              {c.items.map(it => (
                <Link key={it.label} href={it.href} style={{ display: "block", color: "rgba(242,238,232,0.7)", marginBottom: 6, textDecoration: "none", transition: "color .2s" }}>
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="e-mono" style={{ marginTop: 48, color: "rgba(242,238,232,0.4)", fontSize: 9, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, letterSpacing: "0.2em" }}>
          <span>© ELEMENT 78 · ATLANTA · MMXXVI</span>
          <span>IN MY ELEMENT</span>
        </div>
      </div>
    </footer>
  );
}
