import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { syncTrainerPayoutStatus } from "@/lib/connect";
import { connectStartAction } from "@/lib/connect-actions";
import { createClient } from "@/lib/supabase/server";

export default async function TrainerConnectPage({ searchParams }: { searchParams: { return?: string; error?: string } }) {
  const trainer = await getTrainerForCurrentUser();
  if (!trainer) redirect("/login?next=/trainer/onboarding/connect");

  // Refresh from Stripe whenever this page is loaded so the displayed status is
  // current (especially after returning from the hosted onboarding flow).
  if ((trainer as { payout_status?: string }).payout_status !== "active") {
    try { await syncTrainerPayoutStatus(trainer.id); } catch (_) { /* show stale status if Stripe is down */ }
  }

  const sb = createClient();
  const { data } = await sb.from("trainers").select("payout_status, stripe_account_id").eq("id", trainer.id).maybeSingle();
  const status = (data as { payout_status?: string } | null)?.payout_status ?? "unverified";
  const hasAccount = Boolean((data as { stripe_account_id?: string | null } | null)?.stripe_account_id);

  const statusColor: Record<string, string> = {
    active: "var(--sky)",
    pending: "rgba(242,238,232,0.65)",
    rejected: "var(--rose)",
    unverified: "rgba(242,238,232,0.55)",
  };

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/trainer/dashboard" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>DASHBOARD</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>SETUP · COACH PAYOUTS</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>PAYOUTS.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
            Element 78 keeps 20% of every booking. The remaining 80% goes straight to your bank via Stripe — usually within 2 business days. Set up your account once and you're done.
          </p>
        </div>

        <div style={{ marginTop: 28, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>STATUS</div>
          <div style={{ marginTop: 8, fontFamily: "var(--font-display)", fontSize: 28, color: statusColor[status] ?? "var(--bone)" }}>
            {status.toUpperCase()}
          </div>
          {status === "active" && (
            <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.6)", fontSize: 11, letterSpacing: "0.14em" }}>
              You're set. New bookings will route to your account automatically.
            </div>
          )}
          {status === "pending" && (
            <div className="e-mono" style={{ marginTop: 10, color: "rgba(242,238,232,0.6)", fontSize: 11, letterSpacing: "0.14em" }}>
              Stripe is reviewing your details. Continue below if any steps remain.
            </div>
          )}
          {status === "rejected" && (
            <div className="e-mono" style={{ marginTop: 10, color: "var(--rose)", fontSize: 11, letterSpacing: "0.14em" }}>
              Stripe needs more info — open the onboarding flow to fix it.
            </div>
          )}
        </div>

        {status !== "active" && (
          <form action={connectStartAction} style={{ marginTop: 22 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>
              {hasAccount ? "CONTINUE WITH STRIPE" : "CREATE STRIPE ACCOUNT"}
            </button>
          </form>
        )}

        {searchParams.return === "1" && (
          <div className="e-mono" style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ ONBOARDING SUBMITTED · STATUS REFRESHED
          </div>
        )}
      </div>
    </div>
  );
}
