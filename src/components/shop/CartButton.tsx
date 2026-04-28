"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { Icon } from "@/components/ui/Icon";

export function CartButton() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link href="/cart" aria-label="Cart" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Icon name="bag" size={18} />
      {mounted && count > 0 && (
        <span style={{ position: "absolute", top: -2, right: -2, background: "var(--sky)", color: "var(--ink)", borderRadius: 999, padding: "0 4px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600 }}>{count}</span>
      )}
    </Link>
  );
}
