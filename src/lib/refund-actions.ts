"use server";

/**
 * Self-serve refund server action. Wraps `refundPurchase` with ownership +
 * eligibility checks so users can hit a button on /account/purchases without
 * us trusting client input.
 *
 * Errors redirect (instead of throwing) so the page surfaces a friendly
 * banner rather than Next's error overlay.
 */

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { refundPurchase } from "@/lib/purchases";
import type { Purchase } from "@/lib/purchases";
import { isRefundable } from "@/lib/refund-eligibility";

export async function requestRefundAction(formData: FormData): Promise<void> {
  const purchaseId = String(formData.get("purchase_id") ?? "").trim();
  if (!purchaseId) {
    redirect("/account/purchases?error=" + encodeURIComponent("Missing purchase id"));
  }

  const user = await getUser();
  if (!user) {
    redirect("/login?next=/account/purchases");
  }

  const sb = createAdminClient();
  const { data } = await sb.from("purchases").select("*").eq("id", purchaseId).maybeSingle();
  const purchase = data as Purchase | null;

  if (!purchase || purchase.user_id !== user.id) {
    redirect("/account/purchases?error=" + encodeURIComponent("Purchase not found"));
  }

  const { eligible, reason } = await isRefundable(purchase as Purchase);
  if (!eligible) {
    redirect("/account/purchases?error=" + encodeURIComponent(reason ?? "Not refundable"));
  }

  await refundPurchase(purchaseId, { reason: "requested_by_customer" });

  redirect("/account/purchases?refunded=" + encodeURIComponent(purchaseId));
}
