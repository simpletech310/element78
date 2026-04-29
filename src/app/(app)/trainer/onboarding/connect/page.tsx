import { redirect } from "next/navigation";
import { CoachShell } from "@/components/site/CoachShell";
import { getTrainerForCurrentUser } from "@/lib/trainer-auth";
import { syncTrainerPayoutStatus } from "@/lib/connect";
import { connectStartAction } from "@/lib/connect-actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoachConnectPage({ searchParams }: { searchParams: { return?: string; error?: string } }) {
  const coach = await getTrainerForCurrentUser();
  if (!coach) redirect("/login?next=/trainer/onboarding/connect");

  // Refresh from Stripe whenever this page loads so the displayed status is
  // current (especially after returning from the hosted onboarding flow).
  if ((coach as { payout_status?: string }).payout_status !== "active") {
    try { await syncTrainerPayoutStatus(coach.id); } catch (_) { /* show stale on Stripe outage */ }
  }

  const sb = createClient();
  const { data } = await sb.from("trainers").select("payout_status, stripe_account_id").eq("id", coach.id).maybeSingle();
  const status = (data as { payout_status?: string } | null)?.payout_status ?? "unverified";
  const hasAccount = Boolean((data as { stripe_account_id?: string | null } | null)?.stripe_account_id);

  const statusColor: Record<string, string> = {
    active: "var(--sky)",
    pending: "rgba(242,238,232,0.65)",
    rejected: "var(--rose)",
    unverified: "rgba(242,238,232,0.55)",
    paused: "rgba(242,238,232,0.55)",
  };

  return (
    <CoachShell coach={{ ...coach, payout_status: status as Parameters<typeof CoachShell>[0]["coach"]["payout_status"] }} pathname="/trainer/onboarding/connect" payoutBanner={false}>
      <div style={{ maxWidth: 720 }}>
        <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92 }}>PAYOUTS.</h1>
        <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
          Element 78 keeps 20% of every booking. The remaining 80% goes straight to your bank via Stripe — usually within 2 business days. Set up your account once and you're done.
        </p>

        {searchParams.error && /signed up for connect/i.test(searchParams.error) ? (
          <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: "rgba(243,200,99,0.08)", border: "1px solid rgba(243,200,99,0.45)" }}>
            <div className="e-mono" style={{ color: "rgb(243,200,99)", fontSize: 10, letterSpacing: "0.2em" }}>⚠ CONNECT NOT ENABLED YET</div>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(242,238,232,0.85)", lineHeight: 1.6 }}>
              Stripe Connect needs to be enabled on the Element 78 platform account once before any coach can onboard. The platform owner can enable it in a single click.
            </p>
            <a
              href="https://dashboard.stripe.com/connect/overview"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sky"
              style={{ marginTop: 14, display: "inline-block", padding: "10px 18px" }}
            >
              ENABLE CONNECT IN STRIPE DASHBOARD →
            </a>
            <div className="e-mono" style={{ marginTop: 12, color: "rgba(242,238,232,0.55)", fontSize: 9, letterSpacing: "0.16em" }}>
              ONCE ENABLED · COME BACK AND HIT CREATE STRIPE ACCOUNT
            </div>
          </div>
        ) : searchParams.error ? (
          <div className="e-mono" style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid var(--rose)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em", lineHeight: 1.5, wordBreak: "break-word" }}>
            ✗ {searchParams.error.replace(/_/g, " ").toUpperCase()}
          </div>
        ) : null}

        <div style={{ marginTop: 26, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
          <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>STATUS</div>
          <div style={{ marginTop: 10, fontFamily: "var(--font-display)", fontSize: 36, color: statusColor[status] ?? "var(--bone)" }}>
            {status.toUpperCase()}
          </div>
          {status === "active" && (
            <div className="e-mono" style={{ marginTop: 12, color: "rgba(242,238,232,0.6)", fontSize: 11, letterSpacing: "0.14em" }}>
              You're set. New bookings route to your account automatically.
            </div>
          )}
          {status === "pending" && (
            <div className="e-mono" style={{ marginTop: 12, color: "rgba(242,238,232,0.6)", fontSize: 11, letterSpacing: "0.14em" }}>
              Stripe is reviewing your details. Continue below if any steps remain.
            </div>
          )}
          {status === "rejected" && (
            <div className="e-mono" style={{ marginTop: 12, color: "var(--rose)", fontSize: 11, letterSpacing: "0.14em" }}>
              Stripe needs more info — open the onboarding flow to fix it.
            </div>
          )}
        </div>

        {status !== "active" && (
          <form action={connectStartAction} style={{ marginTop: 22 }}>
            <button type="submit" className="btn btn-sky" style={{ padding: "14px 26px", fontSize: 12 }}>
              {hasAccount ? "CONTINUE WITH STRIPE →" : "CREATE STRIPE ACCOUNT →"}
            </button>
          </form>
        )}

        {searchParams.return === "1" && (
          <div className="e-mono" style={{ marginTop: 22, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ ONBOARDING SUBMITTED · STATUS REFRESHED
          </div>
        )}
      </div>
    </CoachShell>
  );
}
