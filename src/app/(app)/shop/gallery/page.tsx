import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { CartButton } from "@/components/shop/CartButton";
import { listProducts } from "@/lib/data/queries";

export default async function ShopGallery() {
  const products = await listProducts();
  const filters = [{ l: `ALL · ${products.length}`, a: true }, { l: "NEW IN" }, { l: "APPAREL" }, { l: "GEAR" }, { l: "ACCESSORIES" }, { l: "SALE" }];

  return (
    <div style={{ background: "var(--bone)", color: "var(--ink)", fontFamily: "var(--font-body)", minHeight: "100dvh" }}>
      <Navbar />
      <div style={{ paddingBottom: 80, maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ padding: "14px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>STORE · SS26</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>THE GALLERY</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(10,14,20,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="search" size={18} />
            </button>
            <CartButton />
          </div>
        </div>

        <div style={{ padding: "12px 22px 4px" }}>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 380 }}>
            <Photo src="/assets/blue-set-rooftop.jpg" alt="" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,14,20,0.95))" }} />
            <div style={{ position: "absolute", top: 14, left: 14, padding: "5px 10px", borderRadius: 3, background: "var(--sky)", color: "var(--ink)" }} className="e-mono">LOOKBOOK · DROP 04</div>
            <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, color: "var(--bone)" }}>
              <div className="e-display" style={{ fontSize: 36, lineHeight: 0.9 }}>WEST<br/>COAST<br/><em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>capsule.</em></div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-sky" style={{ padding: "10px 18px" }}>SHOP DROP</button>
                <button className="btn btn-ghost" style={{ padding: "10px 18px", color: "var(--bone)", borderColor: "rgba(242,238,232,0.4)" }}>WATCH FILM</button>
              </div>
            </div>
          </div>
        </div>

        <div className="no-scrollbar" style={{ padding: "16px 22px 4px", display: "flex", gap: 8, overflowX: "auto" }}>
          {filters.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999, whiteSpace: "nowrap",
              background: c.a ? "var(--ink)" : "transparent",
              color: c.a ? "var(--bone)" : "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
            }}>{c.l}</div>
          ))}
        </div>

        <div style={{ padding: "8px 22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>{products.length} ITEMS</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>NEWEST</span>
            <Icon name="chevronDown" size={14} />
          </div>
        </div>

        <div style={{ padding: "8px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {products.map((p, i) => {
            const isWide = i === 2 || i === 5;
            return (
              <Link key={p.id} href={`/shop/${p.slug}`} style={{
                gridColumn: isWide ? "span 2" : "span 1",
                position: "relative", borderRadius: 12, overflow: "hidden", background: "var(--bone-2)",
                color: "var(--ink)",
              }}>
                <div style={{ aspectRatio: isWide ? "2.05" : "0.78", position: "relative" }}>
                  <Photo src={p.hero_image ?? ""} alt={p.name} style={{ position: "absolute", inset: 0 }} />
                  {p.tag && (
                    <span style={{ position: "absolute", top: 8, left: 8, padding: "3px 7px", borderRadius: 3, background: "var(--ink)", color: "var(--sky)" }} className="e-mono">{p.tag}</span>
                  )}
                  <button style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(242,238,232,0.85)", backdropFilter: "blur(10px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="heart" size={14} />
                  </button>
                </div>
                <div style={{ padding: "10px 4px 4px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.02em", lineHeight: 1.15, flex: 1, minWidth: 0 }}>{p.name}</div>
                  <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 11 }}>${(p.price_cents/100).toFixed(0)}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ padding: "24px 22px 0" }}>
          <div style={{ borderTop: "1px solid rgba(10,14,20,0.12)", paddingTop: 18, textAlign: "center" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.4)", marginBottom: 8 }}>SHIPS FROM COMPTON · 2-DAY</div>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, color: "var(--ink)" }}>Wear it. Train in it. Leave the house in it.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
