"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPurchaseAndCheckout } from "@/lib/purchases";

/**
 * Server-side cart actions. The cart is an `orders` row with `status='cart'`.
 * We use the admin client because:
 *   - cart upserts cross order + order_items in two writes — using admin keeps
 *     a single source of truth and avoids RLS quirks when the row is created
 *     mid-flow.
 *   - we always re-derive the user_id from `getUser()` and gate every write
 *     on `order.user_id === user.id`, so admin doesn't widen the threat model.
 */

type CartOrder = {
  id: string;
  user_id: string;
  status: string;
  subtotal_cents: number;
};

type CartItem = {
  id: string;
  order_id: string;
  variant_id: string;
  qty: number;
  price_cents: number;
};

async function ensureCartOrder(userId: string): Promise<CartOrder> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");

  const { data: existing } = await sb
    .from("orders")
    .select("id, user_id, status, subtotal_cents")
    .eq("user_id", userId)
    .eq("status", "cart")
    .maybeSingle();
  if (existing) return existing as CartOrder;

  const { data: created, error } = await sb
    .from("orders")
    .insert({ user_id: userId, status: "cart", subtotal_cents: 0 })
    .select("id, user_id, status, subtotal_cents")
    .single();
  if (error || !created) throw new Error(`Failed to create cart: ${error?.message ?? "no row"}`);
  return created as CartOrder;
}

async function recomputeSubtotal(orderId: string): Promise<number> {
  const sb = createAdminClient();
  if (!sb) return 0;
  const { data: items } = await sb
    .from("order_items")
    .select("qty, price_cents")
    .eq("order_id", orderId);
  const subtotal = ((items as Array<{ qty: number; price_cents: number }>) ?? []).reduce(
    (sum, it) => sum + it.qty * it.price_cents,
    0,
  );
  await sb.from("orders").update({ subtotal_cents: subtotal }).eq("id", orderId);
  return subtotal;
}

async function assertOwnsItem(itemId: string, userId: string): Promise<CartItem> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");
  const { data: item } = await sb
    .from("order_items")
    .select("id, order_id, variant_id, qty, price_cents")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new Error("Item not found");
  const { data: order } = await sb
    .from("orders")
    .select("user_id, status")
    .eq("id", (item as CartItem).order_id)
    .maybeSingle();
  if (!order || (order as { user_id: string; status: string }).user_id !== userId) {
    throw new Error("Forbidden");
  }
  if ((order as { status: string }).status !== "cart") {
    throw new Error("Order is no longer editable");
  }
  return item as CartItem;
}

export async function addToCartAction(formData: FormData): Promise<void> {
  let variantId = String(formData.get("variant_id") ?? "");
  const productIdHint = String(formData.get("product_id") ?? "");
  const qty = Math.max(1, Number(formData.get("qty") ?? 1) || 1);
  const returnTo = String(formData.get("return_to") ?? "/cart");

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");

  // Resolve variant id: explicit `variant_id` wins; otherwise fall back to
  // the product's first variant. Lets the inline "+" button on the catalog
  // grid work without a variant picker.
  if (!variantId && productIdHint) {
    const { data: defaultVariant } = await sb
      .from("product_variants")
      .select("id")
      .eq("product_id", productIdHint)
      .order("id")
      .limit(1)
      .maybeSingle();
    if (defaultVariant) variantId = (defaultVariant as { id: string }).id;
  }
  if (!variantId) redirect(returnTo);

  // Look up variant -> product so we can snapshot price_cents.
  const { data: variant } = await sb
    .from("product_variants")
    .select("id, product_id")
    .eq("id", variantId)
    .maybeSingle();
  if (!variant) redirect(returnTo);

  const { data: product } = await sb
    .from("products")
    .select("id, price_cents")
    .eq("id", (variant as { product_id: string }).product_id)
    .maybeSingle();
  if (!product) redirect(returnTo);
  const priceCents = (product as { price_cents: number }).price_cents;

  const order = await ensureCartOrder(user.id);

  const { data: existingItem } = await sb
    .from("order_items")
    .select("id, qty")
    .eq("order_id", order.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existingItem) {
    await sb
      .from("order_items")
      .update({ qty: (existingItem as { qty: number }).qty + qty })
      .eq("id", (existingItem as { id: string }).id);
  } else {
    await sb.from("order_items").insert({
      order_id: order.id,
      variant_id: variantId,
      qty,
      price_cents: priceCents,
    });
  }

  await recomputeSubtotal(order.id);
  revalidatePath("/cart");
  redirect(returnTo);
}

export async function updateCartQtyAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "");
  const qty = Number(formData.get("qty") ?? 0) || 0;
  if (!itemId) redirect("/cart");

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/cart")}`);

  const item = await assertOwnsItem(itemId, user.id);
  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");

  if (qty <= 0) {
    await sb.from("order_items").delete().eq("id", itemId);
  } else {
    await sb.from("order_items").update({ qty }).eq("id", itemId);
  }

  await recomputeSubtotal(item.order_id);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) redirect("/cart");

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/cart")}`);

  const item = await assertOwnsItem(itemId, user.id);
  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");

  await sb.from("order_items").delete().eq("id", itemId);
  await recomputeSubtotal(item.order_id);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function checkoutCartAction(): Promise<void> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/cart")}`);

  const sb = createAdminClient();
  if (!sb) throw new Error("Supabase not configured");

  const { data: order } = await sb
    .from("orders")
    .select("id, user_id, status, subtotal_cents")
    .eq("user_id", user.id)
    .eq("status", "cart")
    .maybeSingle();

  if (!order) redirect("/cart?error=empty");
  const cartOrder = order as CartOrder;

  const { data: items } = await sb
    .from("order_items")
    .select("id, qty, price_cents")
    .eq("order_id", cartOrder.id);
  const lines = (items as Array<{ qty: number; price_cents: number }>) ?? [];
  if (lines.length === 0) redirect("/cart?error=empty");

  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price_cents, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);

  // Persist the recomputed subtotal and flip the order to "pending" so the
  // unique-cart-per-user index frees up immediately and a re-attempt creates
  // a fresh cart row.
  await sb
    .from("orders")
    .update({ status: "pending", subtotal_cents: subtotal })
    .eq("id", cartOrder.id);

  const { checkoutUrl } = await createPurchaseAndCheckout({
    userId: user.id,
    kind: "shop_order",
    amountCents: subtotal,
    description: `Shop order · ${itemCount} item${itemCount === 1 ? "" : "s"}`,
    refIds: { order_id: cartOrder.id },
    successPath: `/account/purchases?paid=${cartOrder.id}`,
    cancelPath: "/cart",
  });

  redirect(checkoutUrl);
}
