/**
 * Membership-tier policy. Lives in code (not DB) so we can adjust the rules
 * without a migration. The DB only stores the tier name.
 *
 * Guest privileges:
 *   - free / basic: no included guest passes — must pay $25 to bring someone.
 *   - premium: 1 guest pass per month included.
 *   - elite: unlimited guest passes.
 */

export type MembershipTier = "free" | "basic" | "premium" | "elite";

export const GUEST_PASS_PRICE_CENTS = 2500;

export function tierIncludesGuest(tier: MembershipTier): {
  /** Does the tier include any guest privileges? */
  included: boolean;
  /** Hard cap per month, or `null` for unlimited. */
  monthlyCap: number | null;
  /** Human label for the gym page. */
  label: string;
} {
  switch (tier) {
    case "elite":
      return { included: true, monthlyCap: null, label: "UNLIMITED GUESTS" };
    case "premium":
      return { included: true, monthlyCap: 1, label: "1 GUEST / MONTH INCLUDED" };
    case "basic":
    case "free":
    default:
      return { included: false, monthlyCap: 0, label: "GUEST PASS · $25" };
  }
}

export function tierLabel(tier: MembershipTier): string {
  switch (tier) {
    case "elite":   return "ELITE · 24H";
    case "premium": return "PREMIUM";
    case "basic":   return "BASIC";
    case "free":    return "FREE";
    default:        return "BASIC";
  }
}
