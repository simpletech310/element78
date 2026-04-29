/**
 * Stripe Connect — coach payouts via Express accounts. 80/20 split: trainer
 * receives 80%, platform keeps 20% as `application_fee_amount`.
 *
 * Wave 1 Agent A implements the body of these helpers; this stub locks the
 * call surface so other agents can import without races.
 */

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PLATFORM_FEE_BPS = 2000; // 20.00%

export function platformFeeFor(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}
export function trainerCutFor(amountCents: number): number {
  return amountCents - platformFeeFor(amountCents);
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
  // Implementation provided by Wave 1 Agent A.
  void trainerId; void email; void refreshUrl; void returnUrl;
  throw new Error("ensureConnectAccountForTrainer not implemented");
}

/**
 * Refresh payout_status from Stripe (called when the dashboard loads for a
 * coach with `pending` or `unverified` status).
 */
export async function syncTrainerPayoutStatus(trainerId: string): Promise<void> {
  void trainerId;
  throw new Error("syncTrainerPayoutStatus not implemented");
}

/**
 * Build the Stripe Checkout `payment_intent_data` block that wires an 80/20
 * split to a trainer's connected account. Used by Slice A's modified
 * createCheckoutIntent path.
 */
export function destinationChargeArgs(
  trainerStripeAccountId: string,
  amountCents: number,
): { application_fee_amount: number; transfer_data: { destination: string } } {
  return {
    application_fee_amount: platformFeeFor(amountCents),
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
