import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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
        const bookingId = session.metadata?.booking_id;
        if (!bookingId) {
          console.warn(
            "[stripe webhook] checkout.session.completed missing metadata.booking_id",
            { sessionId: session.id },
          );
          break;
        }

        const supabase = createAdminClient();
        if (!supabase) {
          console.error(
            "[stripe webhook] Supabase admin client unavailable — cannot mark booking paid",
          );
          return new Response("supabase admin unavailable", { status: 500 });
        }

        const { error } = await supabase
          .from("trainer_bookings")
          .update({
            paid_status: "paid",
            stripe_session_id: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);

        if (error) {
          console.error("[stripe webhook] failed to update booking", {
            bookingId,
            sessionId: session.id,
            error,
          });
          return new Response("db update failed", { status: 500 });
        }
        break;
      }

      case "charge.refunded": {
        // MVP: log only. Full implementation would resolve charge ->
        // payment_intent -> checkout session, match against
        // trainer_bookings.stripe_session_id, then flip paid_status to
        // 'refunded'. Skipping for now — manual reconciliation via
        // Stripe Dashboard + Supabase is acceptable at current volume.
        const charge = event.data.object as Stripe.Charge;
        console.info("[stripe webhook] charge.refunded received (no-op)", {
          chargeId: charge.id,
          paymentIntent: charge.payment_intent,
        });
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
