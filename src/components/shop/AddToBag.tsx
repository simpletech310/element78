"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { Icon } from "@/components/ui/Icon";
import type { Product, ProductVariant } from "@/lib/data/types";

export function AddToBagInline({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add({
          product_id: product.id,
          qty: 1,
          snapshot: { name: product.name, price_cents: product.price_cents, image: product.hero_image ?? "", slug: product.slug },
        });
      }}
      style={{ position: "absolute", bottom: 8, right: 8, width: 32, height: 32, borderRadius: 999, background: "var(--bone)", color: "var(--ink)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      aria-label={`Add ${product.name} to bag`}
    >
      <Icon name="plus" size={14} />
    </button>
  );
}

export function AddToBagFull({ product, variants }: { product: Product; variants: ProductVariant[] }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");

  const variant = variants.find(v => v.color === color && v.size === size) ?? variants[0];

  return (
    <>
      {colors.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>COLOR · {color}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{
                padding: "6px 12px", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em",
                background: color === c ? "var(--ink)" : "transparent",
                color: color === c ? "var(--bone)" : "var(--ink)",
                border: color === c ? "none" : "1px solid rgba(10,14,20,0.15)", cursor: "pointer",
              }}>{c.toUpperCase()}</button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>SIZE · {size}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {sizes.map(sz => (
              <button key={sz} type="button" onClick={() => setSize(sz)} style={{
                width: 44, height: 44, borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11,
                background: size === sz ? "var(--ink)" : "transparent",
                color: size === sz ? "var(--bone)" : "var(--ink)",
                border: size === sz ? "none" : "1px solid rgba(10,14,20,0.15)", cursor: "pointer",
              }}>{sz}</button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          add({
            product_id: product.id,
            variant_id: variant?.id,
            qty: 1,
            snapshot: { name: product.name, price_cents: product.price_cents, image: product.hero_image ?? "", color, size, slug: product.slug },
          });
          router.push("/cart");
        }}
        className="btn btn-ink"
        style={{ marginTop: 22, width: "100%", padding: "18px 22px" }}
      >
        <Icon name="bag" size={14} />ADD TO BAG · ${(product.price_cents/100).toFixed(0)}
      </button>
    </>
  );
}
