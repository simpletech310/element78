/**
 * Membership subscriptions (3 tiers: free, premium, elite). Slice B agent
 * implements the bodies; this stub exists so other agents have a consistent
 * import path. `basic` is preserved as a legacy enum value but isn't sold.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subscription, SubscriptionPlan, SubscriptionTier } from "@/lib/data/types";

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const sb = createAdminClient();
  const { data } = await sb.from("subscription_plans").select("*").eq("active", true).order("price_cents");
  return ((data as Array<Record<string, unknown>>) ?? []).map(r => ({
    tier: r.tier as SubscriptionTier,
    stripe_product_id: (r.stripe_product_id as string | null) ?? null,
    stripe_price_id: (r.stripe_price_id as string | null) ?? null,
    price_cents: Number(r.price_cents ?? 0),
    active: Boolean(r.active),
    display_name: String(r.display_name ?? ""),
    blurb: (r.blurb as string | null) ?? null,
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
  }));
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();
  return (data as Subscription) ?? null;
}

/**
 * Create a Stripe Checkout session for the given tier. Returns the redirect
 * URL. Wave 1 Slice B agent implements the body.
 */
export async function createSubscriptionCheckout(
  userId: string,
  tier: SubscriptionTier,
  successPath: string,
  cancelPath: string,
): Promise<{ url: string }> {
  void userId; void tier; void successPath; void cancelPath;
  throw new Error("createSubscriptionCheckout not implemented");
}

/** Cancel-at-period-end. */
export async function cancelSubscription(userId: string): Promise<void> {
  void userId;
  throw new Error("cancelSubscription not implemented");
}

/** Pause-then-resume. */
export async function pauseSubscription(userId: string): Promise<void> {
  void userId;
  throw new Error("pauseSubscription not implemented");
}
export async function resumeSubscription(userId: string): Promise<void> {
  void userId;
  throw new Error("resumeSubscription not implemented");
}
