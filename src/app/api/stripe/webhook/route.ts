import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillPurchase, getPurchaseBySessionId, markPurchaseFailed } from "@/lib/purchases";

// Required so Next.js does not parse / cache the body — Stripe signature
// verification needs the raw bytes exactly as they came in.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(
      "STRIPE_WEBHOOK_SECRET is not configured — set it in .env.local (and Vercel env) before sending webhooks.",
      { status: 500 },
    );
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return new Response(
      "STRIPE_SECRET_KEY is not configured — webhook cannot verify events.",
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecret);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Prefer `purchase_id` (the new unified ledger). Fall back to
        // `booking_id` for legacy 1-on-1 sessions created before the
        // purchases table existed — those rows still live in trainer_bookings
        // with a `stripe_session_id` column.
        const purchaseId = session.metadata?.purchase_id;
        const legacyBookingId = session.metadata?.booking_id;

        if (purchaseId) {
          await fulfillPurchase(purchaseId, {
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            chargeId: null, // payment intent → charge is one extra hop; refunds use payment_intent so we can skip
          });
          break;
        }

        if (legacyBookingId) {
          // Legacy path: this session was created before the purchases ledger
          // landed. Keep the old direct-update for back-compat.
          const supabase = createAdminClient();
          const { error } = await supabase
            .from("trainer_bookings")
            .update({
              paid_status: "paid",
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", legacyBookingId);
          if (error) {
            console.error("[stripe webhook] legacy booking update failed", { legacyBookingId, error });
            return new Response("db update failed", { status: 500 });
          }
          break;
        }

        console.warn("[stripe webhook] checkout.session.completed missing metadata", {
          sessionId: session.id,
        });
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchase = await getPurchaseBySessionId(session.id);
        if (purchase) await markPurchaseFailed(purchase.id);
        break;
      }

      case "charge.refunded": {
        // Auto-refund flow: when a refund is initiated outside our app
        // (e.g. via Stripe Dashboard), update our local state to match.
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (!paymentIntentId) {
          console.info("[stripe webhook] charge.refunded with no payment_intent — skipping");
          break;
        }
        const supabase = createAdminClient();
        const { data: rows } = await supabase
          .from("purchases")
          .select("id, status")
          .eq("stripe_payment_intent_id", paymentIntentId);
        for (const r of (rows as Array<{ id: string; status: string }> | null) ?? []) {
          if (r.status !== "refunded") {
            await supabase.from("purchases").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", r.id);
          }
        }
        break;
      }

      default:
        // Ignore unhandled event types so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler threw", err);
    return new Response("handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
