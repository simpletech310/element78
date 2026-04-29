/**
 * Membership subscriptions (3 tiers: free, premium, elite). Slice B agent
 * implements the bodies; this stub exists so other agents have a consistent
 * import path. `basic` is preserved as a legacy enum value but isn't sold.
 */

import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subscription, SubscriptionPlan, SubscriptionTier } from "@/lib/data/types";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

async function findOrCreateCustomerForUser(userId: string, email: string | null): Promise<string> {
  const sb = createAdminClient();
  // Cache hit on subscriptions table.
  const { data: existingSub } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .maybeSingle();
  const cached = (existingSub as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (cached) return cached;

  const stripe = stripeClient();
  // Search by metadata.user_id so we don't create duplicates after a row deletion.
  const search = await stripe.customers.search({ query: `metadata['user_id']:'${userId}'`, limit: 1 });
  if (search.data[0]) return search.data[0].id;

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  });
  return customer.id;
}

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

export async function createSubscriptionCheckout(
  userId: string,
  email: string | null,
  tier: SubscriptionTier,
  successPath: string,
  cancelPath: string,
): Promise<{ url: string }> {
  if (tier === "free" || tier === "basic") throw new Error(`tier '${tier}' is not purchasable`);
  const sb = createAdminClient();
  const { data: planRow } = await sb.from("subscription_plans").select("*").eq("tier", tier).maybeSingle();
  const plan = planRow as SubscriptionPlan | null;
  if (!plan?.stripe_price_id) throw new Error(`no stripe_price_id for tier ${tier}`);

  const customerId = await findOrCreateCustomerForUser(userId, email);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}${cancelPath}`,
    metadata: { user_id: userId, tier },
    // Stripe doesn't auto-propagate session metadata onto the recurring
    // `customer.subscription.*` events, so mirror it onto subscription_data.
    subscription_data: {
      metadata: { user_id: userId, tier },
    },
  });
  return { url: session.url! };
}

async function loadActiveSubscriptionStripeId(userId: string): Promise<string | null> {
  const sub = await getActiveSubscription(userId);
  return sub?.stripe_subscription_id ?? null;
}

export async function cancelSubscription(userId: string): Promise<void> {
  const id = await loadActiveSubscriptionStripeId(userId);
  if (!id) return;
  const stripe = stripeClient();
  await stripe.subscriptions.update(id, { cancel_at_period_end: true });
  const sb = createAdminClient();
  await sb.from("subscriptions").update({ cancel_at_period_end: true, updated_at: new Date().toISOString() }).eq("stripe_subscription_id", id);
}

export async function pauseSubscription(userId: string): Promise<void> {
  const id = await loadActiveSubscriptionStripeId(userId);
  if (!id) return;
  const stripe = stripeClient();
  await stripe.subscriptions.update(id, { pause_collection: { behavior: "mark_uncollectible" } });
  const sb = createAdminClient();
  await sb.from("subscriptions").update({ status: "paused", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", id);
}

export async function resumeSubscription(userId: string): Promise<void> {
  const id = await loadActiveSubscriptionStripeId(userId);
  if (!id) return;
  const stripe = stripeClient();
  await stripe.subscriptions.update(id, { pause_collection: "" });
  const sb = createAdminClient();
  await sb.from("subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", id);
}
