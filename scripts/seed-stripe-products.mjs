#!/usr/bin/env node
// Idempotent: creates Stripe Products + monthly Prices for the 3-tier
// subscription, then patches subscription_plans rows with the IDs. Re-running
// is safe — looks up existing products by metadata.tier_slug before creating.

import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!STRIPE_KEY || !STRIPE_KEY.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY missing");
if (!SB_URL || !SB_KEY) throw new Error("supabase env missing");

const stripe = new Stripe(STRIPE_KEY);

const PLANS = [
  {
    tier: "premium",
    name: "Element 78 Premium",
    description: "Full Studio access, classes, programs, 1 guest/month.",
    price_cents: 4900,
  },
  {
    tier: "elite",
    name: "Element 78 Elite",
    description: "24-hour gym, unlimited guests, priority 1-on-1 booking.",
    price_cents: 12900,
  },
];

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function findOrCreateProduct(plan) {
  // Look up by metadata.tier_slug — survives renames.
  const list = await stripe.products.search({
    query: `metadata['tier_slug']:'${plan.tier}'`,
  });
  let product = list.data[0];
  if (!product) {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { tier_slug: plan.tier },
    });
    console.log(`created product ${plan.tier}: ${product.id}`);
  } else {
    console.log(`found product ${plan.tier}: ${product.id}`);
  }
  return product;
}

async function findOrCreatePrice(product, plan) {
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  let price = prices.data.find(
    p => p.unit_amount === plan.price_cents && p.recurring?.interval === "month" && p.currency === "usd",
  );
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price_cents,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tier_slug: plan.tier },
    });
    console.log(`created price ${plan.tier}: ${price.id}`);
  } else {
    console.log(`found price ${plan.tier}: ${price.id}`);
  }
  return price;
}

const results = [];
for (const plan of PLANS) {
  const product = await findOrCreateProduct(plan);
  const price = await findOrCreatePrice(product, plan);
  results.push({ tier: plan.tier, product, price });

  const patchRes = await fetch(
    `${SB_URL}/rest/v1/subscription_plans?tier=eq.${plan.tier}`,
    {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({
        stripe_product_id: product.id,
        stripe_price_id: price.id,
        price_cents: plan.price_cents,
      }),
    },
  );
  if (!patchRes.ok) throw new Error(`subscription_plans PATCH ${plan.tier}: ${patchRes.status} ${await patchRes.text()}`);
}

console.log("\n✅ Stripe subscription products synced.\n");
for (const r of results) {
  console.log(`${r.tier.padEnd(8)} → ${r.price.id} (${r.price.unit_amount / 100}/mo)`);
}
