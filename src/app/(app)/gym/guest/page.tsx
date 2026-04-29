import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bringGuestAction } from "@/lib/gym-actions";
import {
  GUEST_PASS_PRICE_CENTS,
  tierIncludesGuest,
  tierLabel,
  type MembershipTier,
} from "@/lib/membership";

export default async function BringGuestPage({ searchParams }: { searchParams: { error?: string; confirmed?: string; paid?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/gym/guest");

  const sb = createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, membership_tier")
    .eq("id", user.id)
    .maybeSingle();
  const tier = ((profile as { membership_tier?: string } | null)?.membership_tier ?? "basic") as MembershipTier;
  const policy = tierIncludesGuest(tier);

  // Count guests this calendar month so we can show the user how many free
  // passes they've used.
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const { count: guestsThisMonth } = await sb
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("host_user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const monthlyUsed = guestsThisMonth ?? 0;
  const freePassRemaining = policy.included
    ? (policy.monthlyCap === null ? Infinity : Math.max(0, policy.monthlyCap - monthlyUsed))
    : 0;
  const willBePaid = freePassRemaining === 0; // either tier excludes guests OR cap reached this month

  const { data: recentGuests } = await sb
    .from("guests")
    .select("id, name, visit_date, status, created_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);
  const recents = (recentGuests as Array<{ id: string; name: string; visit_date: string | null; status: string; created_at: string }>) ?? [];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <Navbar authed={true} />
      <div className="app-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "20px 22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/gym" aria-label="Back" style={{ color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
            <span className="e-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>GYM</span>
          </Link>
        </div>

        <section style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)", letterSpacing: "0.2em" }}>BRING · GUEST</div>
          <h1 className="e-display" style={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 0.92, marginTop: 12 }}>+1.</h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "rgba(10,14,20,0.65)", maxWidth: 480, lineHeight: 1.6 }}>
            Sign someone in for a workout. They&apos;ll sign the waiver at the front desk before they touch the floor.
          </p>
        </section>

        {/* Tier policy banner */}
        <section style={{ padding: "20px 22px 0", maxWidth: 480 }}>
          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: willBePaid ? "rgba(232,181,168,0.12)" : "rgba(46,127,176,0.10)",
            border: `1px solid ${willBePaid ? "rgba(232,181,168,0.4)" : "rgba(46,127,176,0.35)"}`,
          }}>
            <div className="e-mono" style={{ color: willBePaid ? "var(--rose)" : "var(--electric-deep)", fontSize: 10, letterSpacing: "0.22em" }}>
              YOUR TIER · {tierLabel(tier).toUpperCase()}
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: "rgba(10,14,20,0.85)", fontFamily: "var(--font-display)" }}>
              {willBePaid
                ? policy.included
                  ? `You've used your monthly guest${policy.monthlyCap === 1 ? "" : "es"} — this guest is $${(GUEST_PASS_PRICE_CENTS / 100).toFixed(0)}.`
                  : `Bring a guest for $${(GUEST_PASS_PRICE_CENTS / 100).toFixed(0)} — they sign a waiver on arrival.`
                : policy.monthlyCap === null
                  ? `Unlimited guests included on your tier.`
                  : `${freePassRemaining} of ${policy.monthlyCap} free guest${policy.monthlyCap === 1 ? "" : "es"} left this month.`}
            </div>
          </div>
        </section>

        {searchParams.error && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(232,181,168,0.16)", border: "1px solid rgba(232,181,168,0.5)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.18em" }}>
              {searchParams.error}
            </div>
          </section>
        )}
        {searchParams.confirmed && (
          <section style={{ padding: "14px 22px 0" }}>
            <div className="e-mono" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(46,127,176,0.1)", border: "1px solid var(--electric-deep)", color: "var(--electric-deep)", fontSize: 11, letterSpacing: "0.18em" }}>
              ✓ GUEST CONFIRMED{searchParams.paid ? " · PAID" : ""}. THEY SIGN THE WAIVER AT THE FRONT DESK.
            </div>
          </section>
        )}

        <form action={bringGuestAction} style={{ padding: "28px 22px 0", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="GUEST NAME *">
            <input name="name" required placeholder="Jordan Smith" className="ta-input" />
          </Field>
          <Field label="EMAIL">
            <input name="email" type="email" placeholder="jordan@example.com" className="ta-input" />
          </Field>
          <Field label="PHONE">
            <input name="phone" type="tel" placeholder="(404) 555-0100" className="ta-input" />
          </Field>
          <Field label="VISIT DATE">
            <input name="visit_date" type="date" className="ta-input" />
          </Field>

          <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 12, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.08)" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", fontSize: 10, letterSpacing: "0.22em" }}>WAIVER</div>
            <p style={{ marginTop: 6, fontSize: 13, color: "rgba(10,14,20,0.7)", lineHeight: 1.5 }}>
              Your guest signs the standard liability waiver in person at the gym desk on arrival. We don&apos;t collect e-signatures here.
            </p>
          </div>

          <button type="submit" className="btn btn-ink" style={{ marginTop: 6, padding: "14px 22px", fontSize: 12, letterSpacing: "0.2em" }}>
            {willBePaid ? `PAY · BRING GUEST · $${(GUEST_PASS_PRICE_CENTS / 100).toFixed(0)}` : "BRING GUEST · FREE"}
          </button>
          <p className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", letterSpacing: "0.16em", textAlign: "center" }}>
            {willBePaid ? "REDIRECTS TO STRIPE CHECKOUT" : "NO CHARGE — WE'LL EXPECT THEM AT THE DESK"}
          </p>
        </form>

        {recents.length > 0 && (
          <section style={{ padding: "32px 22px 60px", maxWidth: 480, margin: "0 auto" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.55)", letterSpacing: "0.2em", fontSize: 10 }}>RECENT GUESTS</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {recents.map(g => (
                <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{g.name}</div>
                    <div className="e-mono" style={{ marginTop: 4, color: "rgba(10,14,20,0.5)", fontSize: 9, letterSpacing: "0.18em" }}>
                      {g.visit_date ? new Date(g.visit_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "DATE TBD"}
                    </div>
                  </div>
                  <span className="e-mono" style={{ fontSize: 9, alignSelf: "center", color: g.status === "confirmed" ? "var(--electric-deep)" : g.status === "checked_in" ? "var(--electric-deep)" : "rgba(10,14,20,0.5)", letterSpacing: "0.18em" }}>
                    {g.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .ta-input {
          padding: 11px 13px;
          border-radius: 10px;
          background: var(--paper);
          border: 1px solid rgba(10,14,20,0.12);
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 14px;
          width: 100%;
        }
      `}</style>

      <TabBar />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(10,14,20,0.55)", letterSpacing: "0.2em" }}>
      {label}
      {children}
    </label>
  );
}
