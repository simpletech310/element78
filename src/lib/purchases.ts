/**
 * Unified purchase helper. Every paid surface (class, program, 1-on-1, shop)
 * funnels through here so per-client billing history is one query and the
 * Stripe webhook fulfillment logic has a single dispatch table.
 *
 * Flow:
 *   1. Caller creates the underlying entity (booking/enrollment/order) in a
 *      "pending" state.
 *   2. Caller invokes `createPurchaseAndCheckout({ kind, …refIds })`. We
 *      insert a `purchases` row, ask Stripe (or the mock provider) for a
 *      checkout session, stash the session id on the row, and return the URL.
 *   3. Stripe webhook calls `fulfillPurchaseBySessionId(sessionId)` which
 *      flips the purchase to "paid" and runs the kind-specific fulfillment
 *      (e.g. mark booking paid, activate enrollment, mark order paid).
 *   4. Cancel/refund: `refundPurchase(id)` calls Stripe's refund API and
 *      flips the purchase + linked entity to refunded.
 */

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/provider";
import { platformFeeFor, platformFeeBpsForTrainer, getTrainerStripeAccountId } from "@/lib/connect";

export type PurchaseKind = "class_booking" | "program_enrollment" | "trainer_booking" | "shop_order" | "guest_pass" | "subscription" | "event_ticket";

export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed" | "cancelled";

export type PurchaseRefIds = {
  class_booking_id?: string | null;
  program_enrollment_id?: string | null;
  trainer_booking_id?: string | null;
  order_id?: string | null;
};

export type Purchase = {
  id: string;
  user_id: string;
  kind: PurchaseKind;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  class_booking_id: string | null;
  program_enrollment_id: string | null;
  trainer_booking_id: string | null;
  order_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  trainer_id: string | null;
  platform_fee_cents: number;
  created_at: string;
  updated_at: string;
};

export type CreatePurchaseInput = {
  userId: string;
  kind: PurchaseKind;
  amountCents: number;
  description: string;
  refIds: PurchaseRefIds;
  /** Where Stripe should redirect on success (path or full URL). */
  successPath: string;
  /** Where Stripe should redirect if the user cancels mid-checkout. */
  cancelPath: string;
  /**
   * When set, 80/20 split routes funds to this trainer's connected account.
   * If the trainer hasn't completed Stripe Connect onboarding yet, the
   * checkout falls back to platform-only and a pending payouts row is
   * recorded so the coach gets paid out manually later.
   */
  trainerId?: string | null;
};

/**
 * Create a purchase + a Stripe checkout session in one call. Returns the
 * checkout URL the caller should redirect to.
 */
export async function createPurchaseAndCheckout(input: CreatePurchaseInput): Promise<{ purchase: Purchase; checkoutUrl: string }> {
  const sb = createAdminClient();

  // Per-trainer override (added in 0032) lets superadmins flip a coach to a
  // better split — falls back to global PLATFORM_FEE_BPS when unset.
  const splitBps = input.trainerId ? await platformFeeBpsForTrainer(input.trainerId) : null;
  const platformFee = input.trainerId ? platformFeeFor(input.amountCents, splitBps) : 0;

  const { data, error } = await sb
    .from("purchases")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      amount_cents: input.amountCents,
      currency: "usd",
      status: "pending",
      description: input.description,
      class_booking_id: input.refIds.class_booking_id ?? null,
      program_enrollment_id: input.refIds.program_enrollment_id ?? null,
      trainer_booking_id: input.refIds.trainer_booking_id ?? null,
      order_id: input.refIds.order_id ?? null,
      trainer_id: input.trainerId ?? null,
      platform_fee_cents: platformFee,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to create purchase: ${error?.message ?? "no data"}`);
  const purchase = data as Purchase;

  // Look up coach's connected account; null means coach hasn't onboarded yet,
  // so the checkout proceeds platform-only and reconciliation happens later.
  const trainerAccountId = input.trainerId ? await getTrainerStripeAccountId(input.trainerId) : null;

  const provider = getPaymentProvider();
  const intent = await provider.createCheckoutIntent({
    amountCents: input.amountCents,
    bookingId: purchase.id,
    successUrl: input.successPath,
    cancelUrl: input.cancelPath,
    description: input.description,
    trainerStripeAccountId: trainerAccountId,
    applicationFeeAmount: trainerAccountId ? platformFee : null,
  });

  // 3. Stash the session id back on the purchase so we can look it up from
  //    the webhook (which only knows the session id).
  await sb
    .from("purchases")
    .update({ stripe_session_id: intent.sessionId })
    .eq("id", purchase.id);

  return { purchase, checkoutUrl: intent.url };
}

/**
 * Look up a purchase by its Stripe session id. Webhook entry point.
 */
export async function getPurchaseBySessionId(sessionId: string): Promise<Purchase | null> {
  const sb = createAdminClient();
  const { data } = await sb.from("purchases").select("*").eq("stripe_session_id", sessionId).maybeSingle();
  return (data as Purchase) ?? null;
}

/**
 * Mark a purchase paid + fulfill the underlying entity. Called from the Stripe
 * webhook on `checkout.session.completed`. Idempotent — re-fulfilling a paid
 * purchase is a no-op.
 */
export async function fulfillPurchase(
  purchaseId: string,
  stripeFields: { paymentIntentId?: string | null; chargeId?: string | null },
): Promise<void> {
  const sb = createAdminClient();
  const { data: row } = await sb.from("purchases").select("*").eq("id", purchaseId).maybeSingle();
  if (!row) return;
  const purchase = row as Purchase;
  if (purchase.status === "paid") return; // idempotent

  // Flip the purchase first so even if fulfillment fails we have an audit trail.
  await sb
    .from("purchases")
    .update({
      status: "paid",
      stripe_payment_intent_id: stripeFields.paymentIntentId ?? purchase.stripe_payment_intent_id,
      stripe_charge_id: stripeFields.chargeId ?? purchase.stripe_charge_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);

  switch (purchase.kind) {
    case "class_booking":
      if (purchase.class_booking_id) {
        await sb
          .from("bookings")
          .update({
            paid_status: "paid",
            price_cents_paid: purchase.amount_cents,
            stripe_session_id: purchase.stripe_session_id,
          })
          .eq("id", purchase.class_booking_id);
      }
      break;

    case "program_enrollment":
      if (purchase.program_enrollment_id) {
        await sb
          .from("program_enrollments")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          })
          .eq("id", purchase.program_enrollment_id);
      }
      break;

    case "trainer_booking":
      if (purchase.trainer_booking_id) {
        await sb
          .from("trainer_bookings")
          .update({
            paid_status: "paid",
            stripe_session_id: purchase.stripe_session_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", purchase.trainer_booking_id);
      }
      break;

    case "shop_order":
      if (purchase.order_id) {
        await sb
          .from("orders")
          .update({
            status: "paid",
            stripe_session_id: purchase.stripe_session_id,
            checkout_at: new Date().toISOString(),
          })
          .eq("id", purchase.order_id);
        // Decrement inventory for each line item. Tracks only when the product
        // has a non-null stock_qty — null/unlimited products are left alone.
        const { data: items } = await sb
          .from("order_items")
          .select("variant_id, qty")
          .eq("order_id", purchase.order_id);
        const lines = (items as Array<{ variant_id: string | null; qty: number | null }> | null) ?? [];
        if (lines.length > 0) {
          const variantIds = lines.map(l => l.variant_id).filter((x): x is string => !!x);
          if (variantIds.length > 0) {
            const { data: variantRows } = await sb
              .from("product_variants")
              .select("id, product_id")
              .in("id", variantIds);
            const variantToProduct = new Map<string, string>();
            for (const v of (variantRows as Array<{ id: string; product_id: string }> | null) ?? []) {
              variantToProduct.set(v.id, v.product_id);
            }
            // Aggregate qty per product so a multi-variant order only hits the
            // products row once.
            const decrementByProduct = new Map<string, number>();
            for (const l of lines) {
              const pid = l.variant_id ? variantToProduct.get(l.variant_id) : null;
              if (!pid) continue;
              decrementByProduct.set(pid, (decrementByProduct.get(pid) ?? 0) + (l.qty ?? 0));
            }
            for (const [productId, qty] of decrementByProduct) {
              const { data: p } = await sb
                .from("products")
                .select("stock_qty")
                .eq("id", productId)
                .maybeSingle();
              const cur = (p as { stock_qty: number | null } | null)?.stock_qty;
              if (cur == null) continue; // untracked / unlimited
              const next = Math.max(0, cur - qty);
              await sb.from("products").update({ stock_qty: next, in_stock: next > 0 }).eq("id", productId);
            }
          }
        }
      }
      break;

    case "guest_pass": {
      // Guest pass purchase row stashes guest_id in a column added in 0011.
      // Look up the guest and flip status to confirmed.
      const { data: row } = await sb.from("purchases").select("guest_id").eq("id", purchaseId).maybeSingle();
      const guestId = (row as { guest_id?: string | null } | null)?.guest_id;
      if (guestId) {
        await sb.from("guests").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", guestId);
      }
      break;
    }

    case "event_ticket": {
      // Migration 0031 added event_id + event_rsvp_id to purchases. Flip the
      // linked event_rsvps row to paid; trigger updates events.paid_count.
      const { data: row } = await sb
        .from("purchases")
        .select("event_rsvp_id")
        .eq("id", purchaseId)
        .maybeSingle();
      const rsvpId = (row as { event_rsvp_id?: string | null } | null)?.event_rsvp_id;
      if (rsvpId) {
        await sb
          .from("event_rsvps")
          .update({ status: "paid", purchase_id: purchaseId, updated_at: new Date().toISOString() })
          .eq("id", rsvpId);
      }
      break;
    }
  }
}

/**
 * Refund a previously-paid purchase. Calls Stripe's refund API, then flips
 * our local rows to "refunded". For partial refunds, pass `amountCents`.
 */
export async function refundPurchase(purchaseId: string, opts?: { amountCents?: number; reason?: string }): Promise<void> {
  const sb = createAdminClient();
  const { data: row } = await sb.from("purchases").select("*").eq("id", purchaseId).maybeSingle();
  if (!row) return;
  const purchase = row as Purchase;
  if (purchase.status === "refunded") return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  // Only call Stripe when we have a real key AND a payment intent id.
  if (stripeKey && purchase.stripe_payment_intent_id && !stripeKey.startsWith("YOUR")) {
    const stripe = new Stripe(stripeKey);
    try {
      await stripe.refunds.create({
        payment_intent: purchase.stripe_payment_intent_id,
        amount: opts?.amountCents,
        reason: opts?.reason === "fraudulent" ? "fraudulent" : "requested_by_customer",
      });
    } catch (err) {
      // If Stripe rejects (already refunded, etc.), keep going — we still
      // want our local state to reflect the cancel.
      // eslint-disable-next-line no-console
      console.warn("[refund] Stripe refund failed:", (err as Error).message);
    }
  }

  await sb.from("purchases").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", purchaseId);

  // Mirror back onto the linked entity.
  switch (purchase.kind) {
    case "class_booking":
      if (purchase.class_booking_id) {
        await sb.from("bookings").update({ paid_status: "refunded" }).eq("id", purchase.class_booking_id);
      }
      break;
    case "program_enrollment":
      if (purchase.program_enrollment_id) {
        await sb.from("program_enrollments").update({ status: "left" }).eq("id", purchase.program_enrollment_id);
      }
      break;
    case "trainer_booking":
      if (purchase.trainer_booking_id) {
        await sb.from("trainer_bookings").update({ paid_status: "refunded" }).eq("id", purchase.trainer_booking_id);
      }
      break;
    case "shop_order":
      if (purchase.order_id) {
        await sb.from("orders").update({ status: "refunded" }).eq("id", purchase.order_id);
      }
      break;
    case "guest_pass": {
      const { data: row } = await sb.from("purchases").select("guest_id").eq("id", purchaseId).maybeSingle();
      const guestId = (row as { guest_id?: string | null } | null)?.guest_id;
      if (guestId) {
        await sb.from("guests").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", guestId);
      }
      break;
    }
    case "event_ticket": {
      const { data: row } = await sb.from("purchases").select("event_rsvp_id").eq("id", purchaseId).maybeSingle();
      const rsvpId = (row as { event_rsvp_id?: string | null } | null)?.event_rsvp_id;
      if (rsvpId) {
        await sb.from("event_rsvps").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", rsvpId);
      }
      break;
    }
  }
}

/**
 * Mark a purchase failed (Stripe checkout abandoned or session expired).
 * Optional — useful when we receive `checkout.session.expired`.
 */
export async function markPurchaseFailed(purchaseId: string): Promise<void> {
  const sb = createAdminClient();
  await sb
    .from("purchases")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", purchaseId)
    .eq("status", "pending"); // don't clobber paid/refunded
}

/**
 * List a user's purchases for the per-client billing page.
 */
export async function listPurchasesForUser(userId: string): Promise<Purchase[]> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Purchase[]) ?? [];
}
