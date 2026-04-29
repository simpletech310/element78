import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import type { Trainer } from "@/lib/data/types";

const TABS: Array<{ label: string; href: string; match?: (path: string) => boolean }> = [
  { label: "DASHBOARD", href: "/trainer/dashboard", match: (p) => p === "/trainer/dashboard" },
  { label: "CLIENTS", href: "/trainer/clients", match: (p) => p.startsWith("/trainer/clients") },
  { label: "EARNINGS", href: "/trainer/earnings", match: (p) => p === "/trainer/earnings" },
  { label: "CLASSES", href: "/trainer/classes", match: (p) => p.startsWith("/trainer/classes") },
  { label: "PROGRAMS", href: "/trainer/programs", match: (p) => p.startsWith("/trainer/programs") },
  { label: "GROUPS", href: "/trainer/sessions/new", match: (p) => p.startsWith("/trainer/sessions") },
  { label: "AVAILABILITY", href: "/trainer/availability", match: (p) => p === "/trainer/availability" },
  { label: "PROFILE", href: "/trainer/profile", match: (p) => p === "/trainer/profile" },
];

export function CoachShell({
  coach,
  pathname,
  payoutBanner,
  children,
}: {
  coach: Trainer;
  pathname: string;
  /** Show the yellow payout-setup banner above the content. Defaults to coach.payout_status !== 'active'. */
  payoutBanner?: boolean;
  children: React.ReactNode;
}) {
  const showPayoutBanner = payoutBanner ?? coach.payout_status !== "active";
  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      {/* Coach header bar */}
      <div style={{
        borderBottom: "1px solid rgba(143,184,214,0.1)",
        background: "linear-gradient(180deg, rgba(143,184,214,0.04), transparent 80%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 22px 0" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
              border: "2px solid var(--sky)", flexShrink: 0, background: "var(--haze)",
            }}>
              {coach.avatar_url ? (
                <Photo src={coach.avatar_url} alt={coach.name} style={{ width: "100%", height: "100%" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,238,232,0.45)" }}>
                  <Icon name="user" size={26} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>
                COACH · {coach.name.toUpperCase()}
              </div>
              <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em", fontSize: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <span>@{coach.slug}</span>
                <PayoutPill status={coach.payout_status ?? "unverified"} />
              </div>
            </div>
            <Link href={`/trainers/${coach.slug}`} className="e-mono" style={{
              color: "rgba(242,238,232,0.7)", fontSize: 10, letterSpacing: "0.18em", textDecoration: "none",
              padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(143,184,214,0.25)",
            }}>
              VIEW PUBLIC →
            </Link>
          </div>

          {/* Tabs */}
          <nav style={{
            marginTop: 18, display: "flex", gap: 4, overflowX: "auto",
            borderBottom: "none", paddingBottom: 0,
          }}>
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
                    borderBottom: active ? "2px solid var(--sky)" : "2px solid transparent",
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

      {showPayoutBanner && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 22px 0" }}>
          <Link href="/trainer/onboarding/connect" className="e-mono" style={{
            display: "block", padding: "14px 16px", borderRadius: 12,
            background: "rgba(243,200,99,0.1)", border: "1px solid rgba(243,200,99,0.45)",
            color: "rgb(243,200,99)", fontSize: 11, letterSpacing: "0.18em", textDecoration: "none",
          }}>
            ⚠ SET UP PAYOUTS TO START RECEIVING TRANSFERS · 80/20 SPLIT VIA STRIPE →
          </Link>
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 22px 100px" }}>
        {children}
      </main>
    </div>
  );
}

function PayoutPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: "PAYOUTS ACTIVE", bg: "rgba(143,184,214,0.18)", color: "var(--sky)" },
    pending:   { label: "PAYOUTS PENDING", bg: "rgba(243,200,99,0.15)", color: "rgb(243,200,99)" },
    rejected:  { label: "PAYOUTS REJECTED", bg: "rgba(232,181,168,0.18)", color: "var(--rose)" },
    paused:    { label: "PAYOUTS PAUSED", bg: "rgba(242,238,232,0.08)", color: "rgba(242,238,232,0.6)" },
    unverified:{ label: "PAYOUTS NOT SET UP", bg: "rgba(242,238,232,0.06)", color: "rgba(242,238,232,0.55)" },
  };
  const m = map[status] ?? map.unverified;
  return (
    <span style={{ background: m.bg, color: m.color, padding: "3px 8px", borderRadius: 999, fontSize: 9, letterSpacing: "0.18em" }}>
      {m.label}
    </span>
  );
}

/** Reusable section header used inside CoachShell children. */
export function CoachSection({ index, title, hint, action, children }: {
  index?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>
            {index ? `${index} · ` : ""}{title}
          </div>
          {hint && <div style={{ marginTop: 6, fontSize: 13, color: "rgba(242,238,232,0.55)", lineHeight: 1.5 }}>{hint}</div>}
        </div>
        {action}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

export function CoachEmpty({ body }: { body: string }) {
  return (
    <div style={{ padding: "20px 22px", borderRadius: 14, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13, lineHeight: 1.5 }}>
      {body}
    </div>
  );
}
