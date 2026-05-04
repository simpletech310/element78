/**
 * Stripe Connect — coach payouts via Express accounts. 80/20 split: trainer
 * receives 80%, platform keeps 20% as `application_fee_amount`.
 *
 * Wave 1 Agent A implements the body of these helpers; this stub locks the
 * call surface so other agents can import without races.
 */

import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

export const PLATFORM_FEE_BPS = 2000; // 20.00% global default

export function platformFeeFor(amountCents: number, splitBps?: number | null): number {
  // splitBps overrides the global default per-trainer (set by superadmin).
  const bps = typeof splitBps === "number" ? splitBps : PLATFORM_FEE_BPS;
  return Math.round((amountCents * bps) / 10000);
}
export function trainerCutFor(amountCents: number, splitBps?: number | null): number {
  return amountCents - platformFeeFor(amountCents, splitBps);
}

/**
 * Look up the per-coach platform fee in basis points. Returns the trainer's
 * override if set, otherwise the global default. Used at checkout creation so
 * each charge applies the right split to Stripe and the purchases ledger.
 */
export async function platformFeeBpsForTrainer(trainerId: string | null | undefined): Promise<number> {
  if (!trainerId) return PLATFORM_FEE_BPS;
  const sb = createAdminClient();
  const { data } = await sb.from("trainers").select("payout_split_bps").eq("id", trainerId).maybeSingle();
  const override = (data as { payout_split_bps: number | null } | null)?.payout_split_bps;
  return typeof override === "number" ? override : PLATFORM_FEE_BPS;
}

export type CreateConnectAccountResult = {
  accountId: string;
  onboardingUrl: string;
};

/**
 * Onboard a coach: create or reuse their Express account and produce a
 * Stripe-hosted onboarding URL. Idempotent — re-running re-uses the existing
 * stripe_account_id.
 */
export async function ensureConnectAccountForTrainer(
  trainerId: string,
  email: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<CreateConnectAccountResult> {
  const stripe = stripeClient();
  const sb = createAdminClient();
  const { data: row } = await sb.from("trainers").select("stripe_account_id").eq("id", trainerId).maybeSingle();
  let accountId = (row as { stripe_account_id: string | null } | null)?.stripe_account_id ?? null;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      country: "US",
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await sb
      .from("trainers")
      .update({ stripe_account_id: accountId, payout_status: "pending" })
      .eq("id", trainerId);
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { accountId, onboardingUrl: link.url };
}

/**
 * Refresh payout_status from Stripe (called when the dashboard loads for a
 * coach with `pending` or `unverified` status).
 */
export async function syncTrainerPayoutStatus(trainerId: string): Promise<void> {
  const sb = createAdminClient();
  const { data } = await sb.from("trainers").select("stripe_account_id").eq("id", trainerId).maybeSingle();
  const accountId = (data as { stripe_account_id: string | null } | null)?.stripe_account_id;
  if (!accountId) return;
  const stripe = stripeClient();
  const acct = await stripe.accounts.retrieve(accountId);
  let status: "active" | "pending" | "rejected" = "pending";
  if (acct.requirements?.disabled_reason) status = "rejected";
  else if (acct.charges_enabled && acct.payouts_enabled) status = "active";
  await sb.from("trainers").update({ payout_status: status }).eq("id", trainerId);
}

/**
 * Build the Stripe Checkout `payment_intent_data` block that wires an 80/20
 * split to a trainer's connected account. Used by Slice A's modified
 * createCheckoutIntent path.
 */
export function destinationChargeArgs(
  trainerStripeAccountId: string,
  amountCents: number,
  splitBps?: number | null,
): { application_fee_amount: number; transfer_data: { destination: string } } {
  return {
    application_fee_amount: platformFeeFor(amountCents, splitBps),
    transfer_data: { destination: trainerStripeAccountId },
  };
}

/**
 * Look up a trainer's Stripe account id (or null if they haven't onboarded).
 * Centralized here so other code paths don't reach into trainers.* directly.
 */
export async function getTrainerStripeAccountId(trainerId: string): Promise<string | null> {
  const sb = createAdminClient();
  const { data } = await sb.from("trainers").select("stripe_account_id, payout_status").eq("id", trainerId).maybeSingle();
  if (!data) return null;
  const t = data as { stripe_account_id: string | null; payout_status: string };
  // Only honor accounts that have actually finished onboarding. Anything else
  // means the platform should hold funds until the coach finishes.
  if (t.payout_status !== "active") return null;
  return t.stripe_account_id;
}
