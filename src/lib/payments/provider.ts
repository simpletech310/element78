/**
 * Payment provider interface. Mock implementation flips paid_status directly
 * via a fake checkout page. Swap to Stripe by replacing the body of
 * `createCheckoutIntent` with a real `stripe.checkout.sessions.create` call.
 *
 * Required env when going real:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

import { StripePaymentProvider } from "./stripe-provider";

export type CheckoutIntent = {
  /** URL the client should be redirected to in order to pay. */
  url: string;
  /** Provider-specific session id; useful for webhook reconciliation. */
  sessionId: string;
  provider: "mock" | "stripe";
};

export type CreateCheckoutInput = {
  amountCents: number;
  bookingId: string;
  /** Where to send the user after successful payment. */
  successUrl: string;
  cancelUrl: string;
  description: string;
};

export interface PaymentProvider {
  createCheckoutIntent(input: CreateCheckoutInput): Promise<CheckoutIntent>;
}

class MockPaymentProvider implements PaymentProvider {
  async createCheckoutIntent(input: CreateCheckoutInput): Promise<CheckoutIntent> {
    // The mock simply hands back a URL pointing at our local
    // /checkout/trainer/[bookingId] page; clicking "Pay" there triggers the
    // server action that flips `paid_status = paid`.
    return {
      url: `/checkout/trainer/${encodeURIComponent(input.bookingId)}`,
      sessionId: `mock_${input.bookingId}`,
      provider: "mock",
    };
  }
}

/**
 * Returns the Stripe-backed provider when STRIPE_SECRET_KEY is configured
 * with a real value, otherwise falls back to the mock provider so local
 * dev / preview deploys without Stripe still work end-to-end.
 */
export function getPaymentProvider(): PaymentProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  const isReal =
    typeof key === "string" &&
    key.trim().length > 0 &&
    !key.startsWith("YOUR-") &&
    !key.startsWith("YOUR_");
  if (isReal) {
    return new StripePaymentProvider(key as string);
  }
  return new MockPaymentProvider();
}
