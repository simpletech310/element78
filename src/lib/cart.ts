"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  product_id: string;
  variant_id?: string;
  qty: number;
  snapshot: {
    name: string;
    price_cents: number;
    image: string;
    color?: string;
    size?: string;
    slug: string;
  };
};

type State = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (idx: number) => void;
  setQty: (idx: number, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
};

export const useCart = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.findIndex(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id,
          );
          if (existing >= 0) {
            const next = [...s.items];
            next[existing] = { ...next[existing], qty: next[existing].qty + item.qty };
            return { items: next };
          }
          return { items: [...s.items, item] };
        }),
      remove: (idx) => set((s) => ({ items: s.items.filter((_, i) => i !== idx) })),
      setQty: (idx, qty) =>
        set((s) => ({ items: s.items.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, qty) } : it)) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, it) => n + it.qty, 0),
      subtotalCents: () => get().items.reduce((n, it) => n + it.qty * it.snapshot.price_cents, 0),
    }),
    { name: "e78-cart" },
  ),
);

export function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
