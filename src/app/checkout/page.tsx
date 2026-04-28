import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Wordmark } from "@/components/brand/Wordmark";

export default function CheckoutStub() {
  return (
    <div className="app app-dark" style={{ height: "100dvh", background: "var(--ink)", color: "var(--bone)" }}>
      <StatusBar dark />
      <div className="app-top" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 22px 30px", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <Wordmark size={22} color="var(--bone)" />
        <div className="e-mono" style={{ color: "var(--sky)", marginTop: 30 }}>◉ CHECKOUT</div>
        <div className="e-display glow" style={{ fontSize: 48, lineHeight: 0.92, marginTop: 14 }}>COMING<br/>SOON.</div>
        <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, marginTop: 16, color: "rgba(242,238,232,0.75)", maxWidth: 280 }}>
          Stripe is wiring up. Your bag is saved.
        </div>
        <Link href="/cart" className="btn btn-sky" style={{ marginTop: 30 }}>BACK TO BAG</Link>
        <Link href="/shop" className="btn" style={{ marginTop: 10, background: "transparent", color: "var(--bone)", border: "1px solid rgba(255,255,255,0.2)" }}>KEEP SHOPPING</Link>
      </div>
      <HomeIndicator dark />
    </div>
  );
}
