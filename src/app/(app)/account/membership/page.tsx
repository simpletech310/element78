import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { getActiveSubscription, listSubscriptionPlans } from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";
import {
  cancelSubscriptionAction,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
} from "@/lib/subscription-actions";

export default async function AccountMembershipPage({ searchParams }: { searchParams: { upgraded?: string; cancelled?: string; paused?: string; resumed?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/membership");

  const sb = createClient();
  const [sub, plans, profileRow] = await Promise.all([
    getActiveSubscription(user.id),
    listSubscriptionPlans(),
    sb.from("profiles").select("membership_tier").eq("id", user.id).maybeSingle(),
  ]);
  const tier = sub?.tier ?? ((profileRow.data as { membership_tier?: string } | null)?.membership_tier ?? "free");
  const plan = plans.find(p => p.tier === tier) ?? null;

  const flash = searchParams.upgraded ? `WELCOME TO ${searchParams.upgraded.toUpperCase()}`
              : searchParams.cancelled ? "CANCELLATION QUEUED · ACTIVE UNTIL PERIOD END"
              : searchParams.paused ? "MEMBERSHIP PAUSED · BILLING ON HOLD"
              : searchParams.resumed ? "MEMBERSHIP RESUMED"
              : null;

  const periodEndStr = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase() : null;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>YOUR MEMBERSHIP</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 48px)", lineHeight: 0.92, marginTop: 8 }}>
            {(plan?.display_name ?? tier).toUpperCase()}.
          </h1>
        </div>

        {flash && (
          <div className="e-mono" style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(143,184,214,0.1)", border: "1px solid var(--sky)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em" }}>
            ✓ {flash}
          </div>
        )}

        {!sub && tier === "free" && (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>YOU'RE ON FREE</div>
            <p style={{ marginTop: 8, fontSize: 14, color: "rgba(242,238,232,0.75)", lineHeight: 1.5 }}>
              Upgrade to unlock full Studio, classes, programs, and 1-on-1 booking.
            </p>
            <Link href="/membership/upgrade" className="btn btn-sky" style={{ marginTop: 14, padding: "10px 18px", display: "inline-block" }}>
              SEE PLANS →
            </Link>
          </div>
        )}

        {sub && (
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>STATUS</div>
                <div style={{ marginTop: 4, fontFamily: "var(--font-display)", fontSize: 22 }}>
                  {sub.status.toUpperCase()}
                </div>
              </div>
              {plan && (
                <div style={{ textAlign: "right" }}>
                  <div className="e-mono" style={{ color: "rgba(242,238,232,0.55)", fontSize: 10, letterSpacing: "0.2em" }}>PRICE</div>
                  <div style={{ marginTop: 4, fontFamily: "var(--font-display)", fontSize: 22 }}>${plan.price_cents / 100}/MO</div>
                </div>
              )}
            </div>
            {periodEndStr && (
              <div className="e-mono" style={{ marginTop: 14, color: "rgba(242,238,232,0.65)", fontSize: 11, letterSpacing: "0.16em" }}>
                {sub.cancel_at_period_end ? `ENDS · ${periodEndStr}` : `NEXT BILLING · ${periodEndStr}`}
              </div>
            )}

            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/membership/upgrade" className="btn" style={{ padding: "10px 16px", background: "transparent", color: "var(--sky)", border: "1px solid rgba(143,184,214,0.4)" }}>
                CHANGE PLAN
              </Link>
              {sub.status === "active" && !sub.cancel_at_period_end && (
                <form action={cancelSubscriptionAction}>
                  <button type="submit" className="btn" style={{ padding: "10px 16px", background: "transparent", color: "var(--rose)", border: "1px solid rgba(232,181,168,0.4)" }}>
                    CANCEL AT PERIOD END
                  </button>
                </form>
              )}
              {sub.status === "active" && (
                <form action={pauseSubscriptionAction}>
                  <button type="submit" className="btn" style={{ padding: "10px 16px", background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.2)" }}>
                    PAUSE
                  </button>
                </form>
              )}
              {sub.status === "paused" && (
                <form action={resumeSubscriptionAction}>
                  <button type="submit" className="btn btn-sky" style={{ padding: "10px 16px" }}>
                    RESUME
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
