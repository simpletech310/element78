import Link from "next/link";
import { redirect } from "next/navigation";
import { CoachShell, CoachSection, CoachEmpty } from "@/components/site/CoachShell";
import { Time } from "@/components/site/Time";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { getTrainerEarnings } from "@/lib/data/queries";
import { fmtDollars } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CoachEarningsPage() {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/earnings");

  const e = await getTrainerEarnings(coach.id);
  const breakdownEntries = Object.entries(e.byKind).sort((a, b) => b[1].cents - a[1].cents);

  return (
    <CoachShell coach={coach} pathname="/trainer/earnings">
      <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>EARNINGS.</h1>
      <p style={{ marginTop: 12, fontSize: 14, color: "rgba(242,238,232,0.65)", lineHeight: 1.6, maxWidth: 640 }}>
        80% of every booking pays out via Stripe — usually within 2 business days of the charge. Pending payouts settle manually once your Stripe account is active.
      </p>

      <section style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Card label="THIS MONTH" big={fmtDollars(e.thisMonthCents, true)} sub={`${e.thisMonthCount} payout${e.thisMonthCount === 1 ? "" : "s"}`} />
        <Card label="LIFETIME"   big={fmtDollars(e.lifetimeCents, true)}  sub={`${e.lifetimeCount} payout${e.lifetimeCount === 1 ? "" : "s"}`} />
        <Card label="PENDING (PRE-ONBOARD)" big={fmtDollars(e.pendingCents, true)} sub="settled manually once Stripe is active" muted />
      </section>

      <CoachSection title="BREAKDOWN BY SURFACE">
        {breakdownEntries.length === 0 ? (
          <CoachEmpty body="No payouts yet — your first one will land here once a member completes a paid booking." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {breakdownEntries.map(([kind, v]) => (
              <div key={kind} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 16, borderRadius: 12, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)",
              }}>
                <div className="e-mono" style={{ fontSize: 11, letterSpacing: "0.18em" }}>{v.label} · {v.count}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{fmtDollars(v.cents, true)}</div>
              </div>
            ))}
          </div>
        )}
      </CoachSection>

      <CoachSection title={`PAYOUT LOG · LAST ${e.recent.length}`}>
        {e.recent.length === 0 ? (
          <CoachEmpty body="Nothing logged yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {e.recent.map(r => (
              <div key={r.payout.id} style={{
                display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, padding: "12px 14px",
                borderRadius: 10, background: "var(--haze)", border: "1px solid rgba(255,255,255,0.04)", alignItems: "center",
              }}>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>
                  <Time iso={r.payout.created_at} format="date" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{r.description.length > 60 ? r.description.slice(0, 57) + "…" : r.description}</div>
                  <div className="e-mono" style={{ marginTop: 3, fontSize: 9, color: "rgba(242,238,232,0.5)", letterSpacing: "0.16em" }}>
                    GROSS {fmtDollars(r.payout.gross_cents, true)} · FEE {fmtDollars(r.payout.platform_fee_cents, true)} · STATUS {r.payout.status.toUpperCase()}
                    {r.payout.stripe_transfer_id ? ` · ${r.payout.stripe_transfer_id.slice(0, 14)}…` : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: r.payout.status === "sent" ? "var(--sky)" : "rgba(242,238,232,0.55)" }}>
                  {fmtDollars(r.payout.trainer_cents, true)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CoachSection>
    </CoachShell>
  );
}

function Card({ label, big, sub, muted }: { label: string; big: string; sub: string; muted?: boolean }) {
  return (
    <div style={{
      padding: 22, borderRadius: 14, background: "var(--haze)",
      border: `1px solid ${muted ? "rgba(143,184,214,0.12)" : "rgba(143,184,214,0.25)"}`,
      opacity: muted ? 0.7 : 1,
    }}>
      <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.2em" }}>{label}</div>
      <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1 }}>{big}</div>
      <div className="e-mono" style={{ marginTop: 8, color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.16em" }}>{sub}</div>
    </div>
  );
}
