"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { createPurchaseAndCheckout } from "@/lib/purchases";
import {
  GUEST_PASS_PRICE_CENTS,
  tierIncludesGuest,
  type MembershipTier,
} from "@/lib/membership";

/**
 * Self check-in. The user taps "I'M HERE" on /gym/checkin and we log a row.
 * Idempotent within a 4-hour window — re-tapping the same day doesn't double-log.
 */
export async function checkInAction(_formData?: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/gym/checkin");

  const sb = createClient();

  // Don't write a duplicate within the last 4 hours.
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60_000).toISOString();
  const { data: recent } = await sb
    .from("gym_check_ins")
    .select("id")
    .eq("user_id", user.id)
    .gte("checked_in_at", fourHoursAgo)
    .limit(1)
    .maybeSingle();

  if (!recent) {
    await sb.from("gym_check_ins").insert({
      user_id: user.id,
      source: "self",
    });
  }

  revalidatePath("/gym/checkin");
  revalidatePath("/gym");
  redirect("/gym/checkin?checkedIn=1");
}

/**
 * Bring a guest. If the host's tier already includes guest privileges, the
 * guest is created in 'confirmed' state with no charge. Otherwise we create
 * the guest in 'pending' state and route through Stripe Checkout for the
 * $25 guest pass; the webhook flips the linked guest's status to 'confirmed'
 * via the `guest_pass_purchase_id`.
 */
export async function bringGuestAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/gym/guest");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const visitDateRaw = String(formData.get("visit_date") ?? "").trim() || null;

  if (!name) redirect("/gym/guest?error=name_required");

  const sb = createClient();

  // Read host membership tier.
  const { data: profile } = await sb.from("profiles").select("membership_tier").eq("id", user.id).maybeSingle();
  const tier = ((profile as { membership_tier?: string } | null)?.membership_tier ?? "basic") as MembershipTier;
  const policy = tierIncludesGuest(tier);

  // If the tier has a monthly cap, enforce it.
  if (policy.included && policy.monthlyCap !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count } = await sb
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("host_user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());
    if ((count ?? 0) >= policy.monthlyCap) {
      // Tier ran out of free passes for the month — fall through to paid pass.
      policy.included = false;
    }
  }

  // Create the guest row first so we have an id to attach to the purchase.
  const initialStatus = policy.included ? "confirmed" : "pending";
  const insert = await sb
    .from("guests")
    .insert({
      host_user_id: user.id,
      name,
      email,
      phone,
      visit_date: visitDateRaw,
      status: initialStatus,
    })
    .select("id")
    .single();
  if (insert.error || !insert.data) {
    redirect(`/gym/guest?error=${encodeURIComponent("Couldn't save guest. Please try again.")}`);
  }
  const guestId = (insert.data as { id: string }).id;

  if (policy.included) {
    // Free path — done.
    revalidatePath("/gym");
    revalidatePath("/gym/guest");
    redirect(`/gym/guest?confirmed=${guestId}`);
  }

  // Paid path — funnel through the unified purchases ledger.
  const { purchase, checkoutUrl } = await createPurchaseAndCheckout({
    userId: user.id,
    kind: "guest_pass",
    amountCents: GUEST_PASS_PRICE_CENTS,
    description: `Guest pass · ${name}`,
    refIds: {},
    successPath: `/gym/guest?confirmed=${guestId}&paid=1`,
    cancelPath: `/gym/guest`,
  });

  // Link purchase ↔ guest in both directions so the webhook (and any later
  // refund) can find the right row from either side.
  const admin = createAdminClient();
  await admin.from("purchases").update({ guest_id: guestId }).eq("id", purchase.id);
  await admin.from("guests").update({ guest_pass_purchase_id: purchase.id }).eq("id", guestId);

  redirect(checkoutUrl);
}
