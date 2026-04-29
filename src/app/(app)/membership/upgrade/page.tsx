import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { listSubscriptionPlans, getActiveSubscription } from "@/lib/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { subscribeAction } from "@/lib/subscription-actions";
import type { SubscriptionPlan } from "@/lib/data/types";

export default async function MembershipUpgradePage({ searchParams }: { searchParams: { cancelled?: string; error?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/membership/upgrade");

  const [plans, sub, profile] = await Promise.all([
    listSubscriptionPlans(),
    getActiveSubscription(user.id),
    (async () => {
      const sb = createClient();
      const { data } = await sb.from("profiles").select("membership_tier").eq("id", user.id).maybeSingle();
      return (data as { membership_tier?: string } | null)?.membership_tier ?? "free";
    })(),
  ]);

  const currentTier = sub?.tier ?? profile;
  const sortedPlans = [...plans].sort((a, b) => a.price_cents - b.price_cents);

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar authed={true} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 22px 80px" }}>
        <Link href="/account" aria-label="Back" style={{ color: "var(--bone)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>ACCOUNT</span>
        </Link>

        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ color: "var(--sky)", letterSpacing: "0.25em", fontSize: 10 }}>MEMBERSHIP</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 0.92, marginTop: 8 }}>CHOOSE YOUR PLAN.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
            Cancel any time from your account page.
          </p>
        </div>

        {searchParams.cancelled && (
          <div className="e-mono" style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.08)", border: "1px solid rgba(232,181,168,0.3)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.18em" }}>
            CHECKOUT CANCELLED — TRY AGAIN ANYTIME
          </div>
        )}

        <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {sortedPlans.map(plan => (
            <PlanCard key={plan.tier} plan={plan} isCurrent={plan.tier === currentTier} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isCurrent }: { plan: SubscriptionPlan; isCurrent: boolean }) {
  const isPaid = plan.tier === "premium" || plan.tier === "elite";
  return (
    <div style={{
      padding: 22, borderRadius: 14, background: "var(--haze)",
      border: `1px solid ${isCurrent ? "var(--sky)" : "rgba(143,184,214,0.18)"}`,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div className="e-mono" style={{ color: "var(--sky)", fontSize: 10, letterSpacing: "0.25em" }}>
        {plan.display_name.toUpperCase()} {isCurrent ? "· CURRENT" : ""}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1 }}>
        {plan.price_cents === 0 ? "FREE" : `$${plan.price_cents / 100}`}
        {plan.price_cents > 0 && (
          <span className="e-mono" style={{ fontSize: 11, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginLeft: 8 }}>/MO</span>
        )}
      </div>
      {plan.blurb && (
        <p style={{ fontSize: 13, color: "rgba(242,238,232,0.7)", lineHeight: 1.5 }}>{plan.blurb}</p>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
        {plan.features.map((f, i) => (
          <li key={i} className="e-mono" style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(242,238,232,0.75)" }}>
            ✓ {f}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        {isCurrent ? (
          <Link href="/account/membership" className="btn" style={{ width: "100%", padding: "10px 16px", textAlign: "center", background: "transparent", color: "rgba(242,238,232,0.7)", border: "1px solid rgba(143,184,214,0.25)" }}>
            MANAGE
          </Link>
        ) : isPaid ? (
          <SubscribeButton tier={plan.tier} />
        ) : (
          <Link href="/home" className="e-mono" style={{ color: "var(--sky)", fontSize: 11, letterSpacing: "0.18em", textDecoration: "none" }}>
            CONTINUE FREE →
          </Link>
        )}
      </div>
    </div>
  );
}

function SubscribeButton({ tier }: { tier: string }) {
  return (
    <form action={subscribeAction} style={{ width: "100%" }}>
      <input type="hidden" name="tier" value={tier} />
      <button type="submit" className="btn btn-sky" style={{ width: "100%", padding: "10px 16px" }}>
        CHOOSE {tier.toUpperCase()}
      </button>
    </form>
  );
}
