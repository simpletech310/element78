import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { FloatingTabBar } from "@/components/site/FloatingTabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { getUser } from "@/lib/auth";
import { getActiveCart } from "@/lib/data/cart-queries";
import {
  updateCartQtyAction,
  removeFromCartAction,
  checkoutCartAction,
} from "@/lib/shop-actions";

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function CartPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/cart")}`);
  }

  const cart = await getActiveCart(user.id);
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, l) => sum + l.item.qty * l.item.price_cents, 0);
  const errorKey = searchParams?.error;

  return (
    <div style={{ background: "var(--ink)", color: "var(--bone)", minHeight: "100dvh", fontFamily: "var(--font-body)" }}>
      <Navbar authed />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 22px 140px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <Link
            href="/shop"
            className="e-mono"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bone)", fontSize: 11, letterSpacing: "0.2em" }}
          >
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <Icon name="chevron" size={14} />
            </span>
            BACK TO SHOP
          </Link>
          <div className="e-display" style={{ fontSize: 28 }}>YOUR BAG</div>
          <div style={{ width: 40 }} />
        </div>

        {errorKey === "empty" && (
          <div className="e-mono" style={{ background: "rgba(199,255,114,0.08)", border: "1px solid rgba(199,255,114,0.25)", color: "var(--sky)", padding: "10px 14px", borderRadius: 10, fontSize: 11, marginBottom: 18 }}>
            CART&apos;S EMPTY — ADD SOMETHING BEFORE CHECKING OUT.
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ padding: "80px 22px", textAlign: "center" }}>
            <div className="e-display glow" style={{ fontSize: 44 }}>CART&apos;S EMPTY.</div>
            <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", marginTop: 12 }}>
              NOTHING IN YOUR ELEMENT YET.
            </div>
            <Link href="/shop" className="btn btn-sky" style={{ marginTop: 26 }}>
              BACK TO SHOP
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((line) => {
                const variantBits = [line.variant.color, line.variant.size].filter(Boolean).join(" · ");
                return (
                  <div
                    key={line.item.id}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(242,238,232,0.04)",
                      border: "1px solid rgba(242,238,232,0.08)",
                    }}
                  >
                    <div
                      style={{
                        width: 96,
                        height: 116,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "rgba(242,238,232,0.06)",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      {line.product.hero_image && (
                        <Photo
                          src={line.product.hero_image}
                          alt={line.product.name}
                          style={{ position: "absolute", inset: 0 }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, letterSpacing: "0.02em" }}>
                          {line.product.name}
                        </div>
                        <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.55)", marginTop: 4 }}>
                          {variantBits || line.product.slug}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, marginTop: 6 }}>
                          {fmtPrice(line.item.price_cents)}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <form action={updateCartQtyAction}>
                            <input type="hidden" name="item_id" value={line.item.id} />
                            <input type="hidden" name="qty" value={Math.max(0, line.item.qty - 1)} />
                            <button
                              type="submit"
                              aria-label="Decrease quantity"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 999,
                                background: "transparent",
                                border: "1px solid rgba(242,238,232,0.2)",
                                color: "var(--bone)",
                                cursor: "pointer",
                              }}
                            >
                              −
                            </button>
                          </form>
                          <span className="e-mono" style={{ minWidth: 22, textAlign: "center" }}>
                            {line.item.qty}
                          </span>
                          <form action={updateCartQtyAction}>
                            <input type="hidden" name="item_id" value={line.item.id} />
                            <input type="hidden" name="qty" value={line.item.qty + 1} />
                            <button
                              type="submit"
                              aria-label="Increase quantity"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 999,
                                background: "transparent",
                                border: "1px solid rgba(242,238,232,0.2)",
                                color: "var(--bone)",
                                cursor: "pointer",
                              }}
                            >
                              +
                            </button>
                          </form>
                        </div>
                        <form action={removeFromCartAction}>
                          <input type="hidden" name="item_id" value={line.item.id} />
                          <button
                            type="submit"
                            className="e-mono"
                            style={{
                              color: "rgba(242,238,232,0.55)",
                              fontSize: 9,
                              letterSpacing: "0.18em",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            REMOVE
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 26, padding: "0 4px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(242,238,232,0.1)",
                }}
              >
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.55)" }}>SUBTOTAL</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{fmtPrice(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.55)" }}>SHIPPING</span>
                <span className="e-mono" style={{ color: "rgba(242,238,232,0.7)" }}>CALCULATED AT CHECKOUT</span>
              </div>

              <form action={checkoutCartAction} style={{ marginTop: 18 }}>
                <button
                  type="submit"
                  className="btn btn-sky"
                  style={{ width: "100%", padding: "18px 22px", fontSize: 14 }}
                >
                  CHECKOUT · {fmtPrice(subtotal)}
                </button>
              </form>
              <div className="e-mono" style={{ fontSize: 9, color: "rgba(242,238,232,0.45)", textAlign: "center", marginTop: 10, letterSpacing: "0.18em" }}>
                SECURED BY STRIPE
              </div>
            </div>
          </>
        )}
      </div>
      <FloatingTabBar />
    </div>
  );
}
