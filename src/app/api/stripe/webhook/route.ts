import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillPurchase, getPurchaseBySessionId, markPurchaseFailed } from "@/lib/purchases";
import { syncTrainerPayoutStatus, trainerCutFor } from "@/lib/connect";

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

        // Subscription checkout: insert/update local subscription row, flip
        // profile tier, log a purchases row for billing history. The recurring
        // `customer.subscription.*` events handle ongoing state changes.
        if (session.mode === "subscription") {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          const userId = (session.metadata?.user_id as string | undefined) ?? null;
          const tier = (session.metadata?.tier as string | undefined) ?? null;
          if (subId && userId && tier) {
            const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as Stripe.Subscription & { current_period_end?: number };
            const supabase = createAdminClient();
            const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              tier,
              stripe_subscription_id: subId,
              stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
              status: sub.status,
              current_period_end: periodEnd,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }, { onConflict: "stripe_subscription_id" });
            await supabase.from("profiles").update({ membership_tier: tier }).eq("id", userId);
            await supabase.from("purchases").insert({
              user_id: userId,
              kind: "subscription",
              amount_cents: session.amount_total ?? 0,
              currency: session.currency ?? "usd",
              status: "paid",
              description: `Element 78 ${tier} · monthly`,
              stripe_session_id: session.id,
            });
          }
          break;
        }

        const purchaseId = session.metadata?.purchase_id;
        const legacyBookingId = session.metadata?.booking_id;

        if (purchaseId) {
          await fulfillPurchase(purchaseId, {
            paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
            chargeId: null,
          });

          // Record the coach payout if this purchase funded a trainer.
          const supabase = createAdminClient();
          const { data: purchase } = await supabase
            .from("purchases")
            .select("id, amount_cents, platform_fee_cents, trainer_id")
            .eq("id", purchaseId)
            .maybeSingle();
          const p = purchase as { id: string; amount_cents: number; platform_fee_cents: number; trainer_id: string | null } | null;
          if (p && p.trainer_id) {
            const gross = p.amount_cents;
            const fee = p.platform_fee_cents;
            const cut = trainerCutFor(gross);
            // Destination charges create the transfer atomically; pull the id
            // from the underlying PaymentIntent's first charge if available.
            let transferId: string | null = null;
            if (typeof session.payment_intent === "string") {
              try {
                const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ["latest_charge"] });
                const charge = pi.latest_charge as Stripe.Charge | null;
                transferId = (charge?.transfer as string | null) ?? null;
              } catch (err) {
                console.warn("[stripe webhook] PI retrieve for transfer_id failed", err);
              }
            }
            // status='sent' when destination charge fired; 'pending' for platform-held
            // (coach not onboarded yet — we'll settle these manually).
            const status = transferId ? "sent" : "pending";
            const { error } = await supabase.from("payouts").upsert({
              trainer_id: p.trainer_id,
              purchase_id: p.id,
              gross_cents: gross,
              platform_fee_cents: fee,
              trainer_cents: cut,
              stripe_transfer_id: transferId,
              status,
            }, { onConflict: "purchase_id" });
            if (error) console.warn("[stripe webhook] payouts upsert failed", error);
          }
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

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const supabase = createAdminClient();
        const userId = (sub.metadata?.user_id as string | undefined) ?? null;
        const tier = (sub.metadata?.tier as string | undefined) ?? null;
        const cpe = (sub as unknown as { current_period_end?: number }).current_period_end;
        const periodEnd = cpe ? new Date(cpe * 1000).toISOString() : null;
        const paused = Boolean(sub.pause_collection);
        let status: string = sub.status;
        if (paused) status = "paused";
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          tier: tier ?? "premium",
          stripe_subscription_id: sub.id,
          stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          status,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_subscription_id" });
        // Reflect tier on profile only when active/trialing.
        if (userId && tier) {
          const newTier = ["active", "trialing"].includes(status) ? tier : "free";
          await supabase.from("profiles").update({ membership_tier: newTier }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const supabase = createAdminClient();
        await supabase.from("subscriptions").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", sub.id);
        const userId = sub.metadata?.user_id as string | undefined;
        if (userId) await supabase.from("profiles").update({ membership_tier: "free" }).eq("id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null };
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subId) {
          const supabase = createAdminClient();
          await supabase.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subId);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const supabase = createAdminClient();
        const { data: trainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("stripe_account_id", account.id)
          .maybeSingle();
        if (trainer) await syncTrainerPayoutStatus((trainer as { id: string }).id);
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
