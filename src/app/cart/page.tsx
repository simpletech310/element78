"use client";

import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { useCart, fmtPrice } from "@/lib/cart";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const subtotal = useCart((s) => s.subtotalCents());

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 140 }}>
        <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/shop" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          </Link>
          <div className="e-display" style={{ fontSize: 24 }}>YOUR BAG</div>
          <div style={{ width: 40 }} />
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "60px 22px", textAlign: "center" }}>
            <div className="e-display" style={{ fontSize: 28 }}>BAG&apos;S EMPTY.</div>
            <div className="e-mono" style={{ fontSize: 10, color: "rgba(10,14,20,0.5)", marginTop: 10 }}>NOTHING IN YOUR ELEMENT YET.</div>
            <Link href="/shop" className="btn btn-ink" style={{ marginTop: 22 }}>BACK TO SHOP</Link>
          </div>
        ) : (
          <>
            <div style={{ padding: "8px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 14, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
                  <div style={{ width: 80, height: 96, borderRadius: 10, overflow: "hidden", background: "var(--bone-2)", position: "relative", flexShrink: 0 }}>
                    {it.snapshot.image && <Photo src={it.snapshot.image} alt={it.snapshot.name} style={{ position: "absolute", inset: 0 }} />}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: "0.02em" }}>{it.snapshot.name}</div>
                      <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 4 }}>
                        {[it.snapshot.color, it.snapshot.size].filter(Boolean).join(" · ") || it.snapshot.slug}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, marginTop: 6 }}>{fmtPrice(it.snapshot.price_cents)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => setQty(i, it.qty - 1)} style={{ width: 28, height: 28, borderRadius: 999, background: "transparent", border: "1px solid rgba(10,14,20,0.15)", cursor: "pointer" }}>−</button>
                        <span className="e-mono">{it.qty}</span>
                        <button onClick={() => setQty(i, it.qty + 1)} style={{ width: 28, height: 28, borderRadius: 999, background: "transparent", border: "1px solid rgba(10,14,20,0.15)", cursor: "pointer" }}>+</button>
                      </div>
                      <button onClick={() => remove(i)} className="e-mono" style={{ color: "rgba(10,14,20,0.5)", fontSize: 9, background: "transparent", border: "none", cursor: "pointer" }}>REMOVE</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "20px 22px", marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(10,14,20,0.08)" }}>
                <span className="e-mono" style={{ color: "rgba(10,14,20,0.6)" }}>SUBTOTAL</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{fmtPrice(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span className="e-mono" style={{ color: "rgba(10,14,20,0.6)" }}>SHIPPING</span>
                <span className="e-mono">CALCULATED AT CHECKOUT</span>
              </div>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 22px 30px", background: "rgba(242,238,232,0.97)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(10,14,20,0.08)" }}>
          <Link href="/checkout" className="btn btn-ink" style={{ width: "100%" }}>
            CHECKOUT · {fmtPrice(subtotal)}
          </Link>
        </div>
      )}
      <HomeIndicator />
    </div>
  );
}
