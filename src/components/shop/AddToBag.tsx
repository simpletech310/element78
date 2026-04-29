"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/lib/shop-actions";
import { Icon } from "@/components/ui/Icon";
import type { Product, ProductVariant } from "@/lib/data/types";

/**
 * Inline "+" button on catalog cards. Lives inside a `<Link>`, so we can't
 * nest a real <form>. We wire the server action up via useTransition + a
 * synthetic FormData instead — it's the same code path, just invoked
 * imperatively. No variant id is sent; the action falls back to the first
 * variant of the product.
 */
export function AddToBagInline({ product }: { product: Product }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const fd = new FormData();
        fd.set("product_id", product.id);
        fd.set("qty", "1");
        fd.set("return_to", "/cart");
        start(() => {
          // Server action returns void / redirects; ignore the result.
          void addToCartAction(fd);
        });
      }}
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 999,
        background: "var(--bone)",
        color: "var(--ink)",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: pending ? 0.6 : 1,
      }}
      aria-label={`Add ${product.name} to bag`}
    >
      <Icon name="plus" size={14} />
    </button>
  );
}

/**
 * Full add-to-bag block on the product detail page. Color/size selectors stay
 * client-side; the selected variant id is mirrored into a hidden input on the
 * form so the submit goes through the server action like any other POST.
 */
export function AddToBagFull({ product, variants }: { product: Product; variants: ProductVariant[] }) {
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");

  const variant =
    variants.find((v) => v.color === color && v.size === size) ?? variants[0];

  return (
    <form action={addToCartAction}>
      <input type="hidden" name="variant_id" value={variant?.id ?? ""} />
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="qty" value="1" />
      <input type="hidden" name="return_to" value="/cart" />

      {colors.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>
            COLOR · {color}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  background: color === c ? "var(--ink)" : "transparent",
                  color: color === c ? "var(--bone)" : "var(--ink)",
                  border: color === c ? "none" : "1px solid rgba(10,14,20,0.15)",
                  cursor: "pointer",
                }}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>
            SIZE · {size}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSize(sz)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: size === sz ? "var(--ink)" : "transparent",
                  color: size === sz ? "var(--bone)" : "var(--ink)",
                  border: size === sz ? "none" : "1px solid rgba(10,14,20,0.15)",
                  cursor: "pointer",
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="submit"
        className="btn btn-ink"
        style={{ marginTop: 22, width: "100%", padding: "18px 22px" }}
      >
        <Icon name="bag" size={14} />
        ADD TO BAG · ${(product.price_cents / 100).toFixed(0)}
      </button>
    </form>
  );
}
