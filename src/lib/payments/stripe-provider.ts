import "server-only";
import Stripe from "stripe";
import type {
  CheckoutIntent,
  CreateCheckoutInput,
  PaymentProvider,
} from "./provider";

/**
 * Real Stripe-backed payment provider. Creates a Checkout Session and
 * returns its hosted URL for redirect. Reconciliation back to the
 * `trainer_bookings` row happens in the webhook
 * (src/app/api/stripe/webhook/route.ts) on `checkout.session.completed`.
 */
export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(secretKey: string) {
    // Letting the SDK pick its bundled default API version — the
    // `2024-11-20.acacia` literal that originally lived here is no longer
    // assignable to stripe@22's `LatestApiVersion` type ("2026-04-22.dahlia").
    // Defaulting keeps types clean and stays in lockstep with the SDK.
    this.stripe = new Stripe(secretKey);
  }

  async createCheckoutIntent(
    input: CreateCheckoutInput,
  ): Promise<CheckoutIntent> {
    const { amountCents, bookingId, successUrl, cancelUrl, description, trainerStripeAccountId, applicationFeeAmount } =
      input;

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      metadata: { purchase_id: bookingId, booking_id: bookingId },
      success_url: `${origin}${successUrl}`,
      cancel_url: `${origin}${cancelUrl}`,
    };

    if (trainerStripeAccountId && typeof applicationFeeAmount === "number" && applicationFeeAmount > 0) {
      params.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: trainerStripeAccountId },
      };
    }

    const session = await this.stripe.checkout.sessions.create(params);

    return {
      url: session.url!,
      sessionId: session.id,
      provider: "stripe",
    };
  }
}
