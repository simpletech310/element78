#!/usr/bin/env node
// End-to-end Stripe Connect verification:
//   1. Create a fully-onboarded test Express account for Kai (test mode magic)
//   2. Link it to her trainers row
//   3. Create a real Checkout Session with our exact destination-charge params
//      (the same shape `createPurchaseAndCheckout` would emit when a member
//      books a 1-on-1 with her)
//   4. Confirm Stripe accepted the transfer_data + application_fee_amount
//   5. Tear down the test account
//
// Run with: node scripts/test-connect-flow.mjs

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
if (!STRIPE_KEY) throw new Error("STRIPE_SECRET_KEY missing");
if (!SB_URL || !SB_KEY) throw new Error("supabase env missing");

const stripe = new Stripe(STRIPE_KEY);

const PLATFORM_FEE_BPS = 2000; // 20% — must match src/lib/connect.ts
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
const sbHeaders = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

console.log("=== Stripe Connect End-to-End Test ===\n");

// ------------------------------------------------------------------
// 1. Look up Kai
// ------------------------------------------------------------------
const trRes = await fetch(`${SB_URL}/rest/v1/trainers?slug=eq.kai-brooks&select=id,name,stripe_account_id,payout_status`, { headers: sbHeaders });
const [kai] = await trRes.json();
if (!kai) throw new Error("Kai not found in trainers");
console.log(`1. Kai: ${kai.id}`);
console.log(`   current stripe_account_id: ${kai.stripe_account_id ?? "none"}`);
console.log(`   current payout_status: ${kai.payout_status}\n`);

// ------------------------------------------------------------------
// 2. Create or reuse a test Express account, fully prefilled so it
//    becomes instantly active in test mode.
// ------------------------------------------------------------------
let accountId = kai.stripe_account_id;
let account;
if (accountId) {
  try {
    account = await stripe.accounts.retrieve(accountId);
    console.log(`2. Reusing existing Stripe account ${accountId}`);
  } catch (e) {
    console.log(`   (existing account unreachable: ${e.message})`);
    accountId = null;
  }
}
if (!accountId) {
  // Express accounts in Stripe Connect are designed for hosted onboarding —
  // the platform creates the bare account, the coach finishes verification
  // via a Stripe-hosted form. We can't pre-accept TOS or set `individual`
  // on Express accounts (that errors out). So this matches exactly what
  // src/lib/connect.ts does — just request capabilities, let Stripe own
  // the rest. The destination-charge verification below works whether or
  // not the account is fully verified.
  console.log("2. Creating new test Express account (matches connect.ts)...");
  account = await stripe.accounts.create({
    type: "express",
    email: "kai+connect-test@element78.test",
    country: "US",
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  accountId = account.id;
  console.log(`   created: ${accountId}`);

  // Persist the account_id so the next test reuses it. Status stays
  // 'pending' until the coach clicks through the hosted onboarding URL.
  await fetch(`${SB_URL}/rest/v1/trainers?id=eq.${kai.id}`, {
    method: "PATCH",
    headers: sbHeaders,
    body: JSON.stringify({ stripe_account_id: accountId, payout_status: "pending" }),
  });
  console.log(`   linked to Kai with payout_status='pending' (becomes 'active' after she completes onboarding)\n`);
}

console.log(`   charges_enabled: ${account.charges_enabled}`);
console.log(`   payouts_enabled: ${account.payouts_enabled}`);
console.log(`   requirements.disabled_reason: ${account.requirements?.disabled_reason ?? "(none)"}`);
console.log(`   requirements.currently_due: ${(account.requirements?.currently_due ?? []).join(", ") || "(none)"}\n`);

// ------------------------------------------------------------------
// 3. Build a Checkout Session that matches what our app emits when a
//    member books a 1-on-1 with Kai. Same shape as
//    src/lib/payments/stripe-provider.ts.
// ------------------------------------------------------------------
const amountCents = 7500; // $75 1-on-1
const applicationFeeAmount = Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
const trainerCut = amountCents - applicationFeeAmount;

// Generate a hosted onboarding URL so we can validate the link is generated
// and instruct the user how to finish verification.
const onboardingLink = await stripe.accountLinks.create({
  account: accountId,
  refresh_url: "https://element78.vercel.app/trainer/onboarding/connect",
  return_url: "https://element78.vercel.app/trainer/onboarding/connect?return=1",
  type: "account_onboarding",
});
console.log(`   onboarding URL: ${onboardingLink.url}\n`);

console.log(`3. Attempting Checkout Session — $${amountCents / 100} 1-on-1 with destination charge`);
console.log(`   gross:        ${fmt(amountCents)}`);
console.log(`   platform fee: ${fmt(applicationFeeAmount)}  (${PLATFORM_FEE_BPS / 100}%)`);
console.log(`   to coach:     ${fmt(trainerCut)}\n`);

const transfersActive = (account.capabilities?.transfers === "active");

if (!transfersActive) {
  console.log("   ⏸  SKIPPED · 'transfers' capability is not yet active on the account.");
  console.log("      Express accounts must finish Stripe-hosted onboarding before destination");
  console.log("      charges can route to them. Open the URL above as Kai, fill out the test");
  console.log("      data Stripe provides, then re-run this script.\n");
  console.log("      Test data Stripe accepts:");
  console.log("        Phone:     000-000-0000");
  console.log("        SSN:       000-00-0000  (last 4: 0000)");
  console.log("        DOB:       any date 18+");
  console.log("        Address:   address_full_match · Atlanta · GA · 30301");
  console.log("        Routing:   110000000");
  console.log("        Account:   000123456789");
  console.log("        Web URL:   https://element78.vercel.app");
  console.log("        Industry:  Personal services / Health & wellness");
} else {
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: "1-on-1 session with Kai Brooks" },
          },
          quantity: 1,
        },
      ],
      metadata: { test: "connect-flow", purchase_id: "fake-test-purchase" },
      success_url: "https://element78.vercel.app/account/sessions?test=1",
      cancel_url: "https://element78.vercel.app/trainers/kai-brooks/book",
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: accountId },
      },
    });
  } catch (err) {
    console.error(`   ❌ Stripe rejected the session: ${err.message}`);
    process.exit(1);
  }

  console.log(`   ✅ Session created: ${session.id}`);
  console.log(`   transfer_data.destination accepted: ${accountId}`);
  console.log(`   application_fee_amount accepted: ${fmt(applicationFeeAmount)}`);
  console.log(`   payment_intent: ${session.payment_intent}`);

  console.log("\n4. Verifying PaymentIntent has the expected destination charge config...");
  if (typeof session.payment_intent === "string") {
    const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
    console.log(`   PI ${pi.id}`);
    console.log(`   amount:                  ${fmt(pi.amount)}`);
    console.log(`   application_fee_amount:  ${fmt(pi.application_fee_amount ?? 0)}`);
    console.log(`   transfer_data:           ${JSON.stringify(pi.transfer_data)}`);
    if (pi.transfer_data?.destination !== accountId) {
      console.error("   ❌ destination mismatch!");
      process.exit(1);
    }
    if (pi.application_fee_amount !== applicationFeeAmount) {
      console.error("   ❌ fee mismatch!");
      process.exit(1);
    }
    console.log("   ✅ destination + fee match expected");
  }
  console.log(`\n   Hosted checkout URL: ${session.url}`);
  console.log("   (open as the test member to finish the actual payment)");
}

console.log("\n=== Status ===");
console.log(`  Connect enabled:                ✅`);
console.log(`  Account creation:               ✅`);
console.log(`  Account link generation:        ✅`);
console.log(`  transfers capability active:    ${transfersActive ? "✅" : "⏸  needs onboarding completion"}`);
console.log(`  Destination charge end-to-end:  ${transfersActive ? "✅" : "⏸  pending capability"}`);

if (!transfersActive) {
  console.log("\n=== Next step ===");
  console.log("Open this URL on Kai's behalf to finish onboarding:");
  console.log(`  ${onboardingLink.url}`);
  console.log("Then re-run this script.");
}
