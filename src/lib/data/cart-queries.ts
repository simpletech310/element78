import { createClient } from "@/lib/supabase/server";
import type { Product, ProductVariant } from "./types";

/**
 * Server-side read of the user's active cart (status='cart' order). Returns
 * the order header plus a hydrated row per line item with variant + product
 * snapshots so the cart page can render without follow-up queries.
 *
 * Uses the regular RLS-bound client — the existing policies on `orders` and
 * `order_items` already scope rows to `auth.uid()`. No admin needed for reads.
 */

export type OrderRow = {
  id: string;
  user_id: string;
  status: "cart" | "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
  subtotal_cents: number;
  created_at: string;
  stripe_session_id: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string;
  qty: number;
  price_cents: number;
};

export type CartLine = {
  item: OrderItemRow;
  variant: ProductVariant;
  product: Product;
};

export type ActiveCart = {
  order: OrderRow;
  items: CartLine[];
};

export async function getActiveCart(userId: string): Promise<ActiveCart | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const sb = createClient();

  const { data: order } = await sb
    .from("orders")
    .select("id, user_id, status, subtotal_cents, created_at, stripe_session_id")
    .eq("user_id", userId)
    .eq("status", "cart")
    .maybeSingle();
  if (!order) return null;

  const { data: items } = await sb
    .from("order_items")
    .select("id, order_id, variant_id, qty, price_cents")
    .eq("order_id", order.id);

  const rows = (items as OrderItemRow[]) ?? [];
  if (rows.length === 0) return { order: order as OrderRow, items: [] };

  const variantIds = rows.map(r => r.variant_id);
  const { data: variants } = await sb
    .from("product_variants")
    .select("*")
    .in("id", variantIds);
  const variantList = (variants as ProductVariant[]) ?? [];

  const productIds = Array.from(new Set(variantList.map(v => v.product_id)));
  const { data: products } = await sb
    .from("products")
    .select("*")
    .in("id", productIds);
  const productList = (products as Product[]) ?? [];

  const variantById = new Map(variantList.map(v => [v.id, v]));
  const productById = new Map(productList.map(p => [p.id, p]));

  const lines: CartLine[] = [];
  for (const r of rows) {
    const v = variantById.get(r.variant_id);
    if (!v) continue;
    const p = productById.get(v.product_id);
    if (!p) continue;
    lines.push({ item: r, variant: v, product: p });
  }

  return { order: order as OrderRow, items: lines };
}
