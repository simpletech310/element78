import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getTrainerEarnings } from "@/lib/data/queries";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function TrainerEarningsPage() {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/earnings");

  const e = await getTrainerEarnings(trainer.id);
  const breakdownEntries = Object.entries(e.byKind).sort((a, b) => b[1].cents - a[1].cents);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>TRAINER · {trainer.name.toUpperCase()}</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>EARNINGS.</h1>
          <p style={{ marginTop: 12, fontSize: 13, color: "rgba(242,238,232,0.55)", lineHeight: 1.6 }}>
            80% of every booking paid out via Stripe — usually within 2 business days of the charge.
          </p>
        </div>

        {trainer.payout_status !== "active" && (
          <Link href="/trainer/onboarding/connect" className="e-mono" style={{
            marginTop: 18, display: "block", padding: "14px 16px", borderRadius: 12,
            background: "rgba(243,200,99,0.1)", border: "1px solid rgba(243,200,99,0.5)",
            color: "rgb(243,200,99)", fontSize: 11, letterSpacing: "0.18em", textDecoration: "none",
          }}>
            ⚠ SET UP STRIPE PAYOUTS TO START RECEIVING TRANSFERS →
          </Link>
        )}

        <section style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Card label="THIS MONTH" big={fmt(e.thisMonthCents)} sub={`${e.thisMonthCount} payout${e.thisMonthCount === 1 ? "" : "s"}`} />
          <Card label="LIFETIME"   big={fmt(e.lifetimeCents)}  sub={`${e.lifetimeCount} payout${e.lifetimeCount === 1 ? "" : "s"}`} />
          <Card label="PENDING (PRE-ONBOARD)" big={fmt(e.pendingCents)} sub="settled manually once Stripe is active" muted />
        </section>

        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>BREAKDOWN BY SURFACE</div>
          {breakdownEntries.length === 0 ? (
            <Empty body="No payouts yet." />
          ) : (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {breakdownEntries.map(([kind, v]) => (
                <div key={kind} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: 14, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
                }}>
                  <div className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em" }}>{v.label} · {v.count}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{fmt(v.cents)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginTop: 32 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.2em", fontSize: 10 }}>PAYOUT LOG · LAST {e.recent.length}</div>
          {e.recent.length === 0 ? (
            <Empty body="Nothing logged yet." />
          ) : (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {e.recent.map(r => (
                <div key={r.payout.id} style={{
                  display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 12, padding: "10px 12px",
                  borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)", alignItems: "center",
                }}>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>
                    {new Date(r.payout.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "2-digit" }).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{r.description.length > 60 ? r.description.slice(0, 57) + "…" : r.description}</div>
                    <div className="e-mono" style={{ marginTop: 3, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>
                      GROSS {fmt(r.payout.gross_cents)} · FEE {fmt(r.payout.platform_fee_cents)} · STATUS {r.payout.status.toUpperCase()}
                      {r.payout.stripe_transfer_id ? ` · ${r.payout.stripe_transfer_id.slice(0, 14)}…` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: r.payout.status === "sent" ? "var(--sky)" : "rgba(242,238,232,0.55)" }}>
                    {fmt(r.payout.trainer_cents)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ label, big, sub, muted }: { label: string; big: string; sub: string; muted?: boolean }) {
  return (
    <div style={{
      padding: 18, borderRadius: 14, background: "var(--haze)",
      border: `1px solid ${muted ? "rgba(143,184,214,0.12)" : "rgba(143,184,214,0.25)"}`,
      opacity: muted ? 0.7 : 1,
    }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: 30 }}>{big}</div>
      <div className="e-mono" style={{ marginTop: 6, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>{sub}</div>
    </div>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div style={{ marginTop: 12, padding: "16px 18px", borderRadius: 12, border: "1px dashed rgba(143,184,214,0.25)", color: "rgba(242,238,232,0.55)", fontSize: 13 }}>{body}</div>
  );
}
