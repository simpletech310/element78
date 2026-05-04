import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";

const TABS: Array<{ label: string; href: string; match?: (p: string) => boolean }> = [
  { label: "OVERVIEW", href: "/admin", match: (p) => p === "/admin" },
  { label: "REVENUE", href: "/admin/revenue", match: (p) => p.startsWith("/admin/revenue") },
  { label: "MEMBERS", href: "/admin/users", match: (p) => p.startsWith("/admin/users") },
  { label: "COACHES", href: "/admin/trainers", match: (p) => p.startsWith("/admin/trainers") },
  { label: "APPLICATIONS", href: "/admin/coaches", match: (p) => p.startsWith("/admin/coaches") },
  { label: "PROGRAMS", href: "/admin/programs", match: (p) => p.startsWith("/admin/programs") },
  { label: "EVENTS", href: "/admin/events", match: (p) => p.startsWith("/admin/events") },
  { label: "CHALLENGES", href: "/admin/challenges", match: (p) => p.startsWith("/admin/challenges") },
  { label: "SHOP", href: "/admin/products", match: (p) => p.startsWith("/admin/products") },
  { label: "PURCHASES", href: "/admin/purchases", match: (p) => p.startsWith("/admin/purchases") },
  { label: "PAYOUTS", href: "/admin/payouts", match: (p) => p.startsWith("/admin/payouts") },
  { label: "WALL", href: "/admin/posts", match: (p) => p.startsWith("/admin/posts") },
  { label: "AUDIT", href: "/admin/audit", match: (p) => p.startsWith("/admin/audit") },
];

export function AdminShell({
  pathname,
  title,
  subtitle,
  actions,
  children,
}: {
  pathname: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ borderBottom: "1px solid rgba(143,184,214,0.1)", background: "linear-gradient(180deg, rgba(232,181,168,0.05), transparent 80%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 22px 0" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="e-mono" style={{ color: "var(--rose)", letterSpacing: "0.25em", fontSize: 10 }}>SUPERADMIN</div>
              <div className="e-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1, marginTop: 4 }}>{title}</div>
              {subtitle && <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em", fontSize: 10 }}>{subtitle}</div>}
            </div>
            {actions}
          </div>

          <nav className="no-scrollbar" style={{ marginTop: 18, display: "flex", gap: 4, overflowX: "auto" }}>
            {TABS.map(t => {
              const active = t.match ? t.match(pathname) : pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="e-mono"
                  style={{
                    flexShrink: 0,
                    padding: "10px 14px 12px",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: active ? "var(--bone)" : "rgba(242,238,232,0.55)",
                    textDecoration: "none",
                    borderBottom: active ? "2px solid var(--rose)" : "2px solid transparent",
                    transition: "color 120ms ease",
                  }}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 22px 80px" }}>
        {children}
      </main>
    </div>
  );
}
