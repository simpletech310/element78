import Link from "next/link";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { CartButton } from "@/components/shop/CartButton";
import { AddToBagInline } from "@/components/shop/AddToBag";
import { listProducts } from "@/lib/data/queries";

export default async function ShopScreen() {
  const products = await listProducts();
  const hero = products.find(p => p.slug === "element-set") ?? products[0];
  const grid = products.filter(p => p.id !== hero?.id);
  const cats = [{ l: "ALL", a: true }, { l: "WEAR" }, { l: "GEAR" }, { l: "FUEL" }, { l: "ACCESSORIES" }];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll app-top" style={{ paddingBottom: 100 }}>
        <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>STORE · SS26</div>
            <div className="e-display" style={{ fontSize: 36, marginTop: 2 }}>SHOP</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/shop/gallery" style={{ width: 40, height: 40, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></Link>
            <CartButton />
          </div>
        </div>

        {hero && (
          <div style={{ padding: "4px 22px 16px" }}>
            <Link href={`/shop/${hero.slug}`} style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 460, background: "#0A0E14", display: "block", color: "var(--bone)" }}>
              <Photo src={hero.hero_image ?? ""} alt={hero.name} style={{ position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(10,14,20,0.95) 100%)" }} />
              {hero.tag && (
                <div style={{ position: "absolute", top: 16, left: 16 }}>
                  <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "5px 9px", borderRadius: 4 }}>NEW DROP · 04.27</span>
                </div>
              )}
              <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 6 }}>{hero.subtitle}</div>
                <div className="e-display" style={{ fontSize: 36, lineHeight: 0.92 }}>
                  IN MY<br/>
                  <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>element.</span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>${(hero.price_cents/100).toFixed(0)}</span>
                  {hero.compare_at_cents && (
                    <span style={{ fontSize: 12, color: "rgba(242,238,232,0.55)", textDecoration: "line-through" }}>${(hero.compare_at_cents/100).toFixed(0)}</span>
                  )}
                  <span className="btn btn-bone" style={{ marginLeft: "auto" }}>
                    <Icon name="bag" size={14} />SHOP
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="no-scrollbar" style={{ padding: "0 22px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
          {cats.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.a ? "var(--ink)" : "transparent",
              color: c.a ? "var(--bone)" : "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
              whiteSpace: "nowrap",
            }}>{c.l}</div>
          ))}
        </div>

        <div style={{ padding: "0 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {grid.map(p => (
            <Link key={p.id} href={`/shop/${p.slug}`} style={{ color: "var(--ink)" }}>
              <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "0.82", background: "var(--bone-2)" }}>
                <Photo src={p.hero_image ?? ""} alt={p.name} style={{ position: "absolute", inset: 0 }} />
                {p.tag && (
                  <div style={{ position: "absolute", top: 8, left: 8 }}>
                    <span className="e-tag" style={{ background: "var(--bone)", color: "var(--ink)", padding: "3px 7px", borderRadius: 3, fontSize: 8 }}>{p.tag}</span>
                  </div>
                )}
                <AddToBagInline product={p} />
              </div>
              <div style={{ padding: "8px 2px 0" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: "0.02em" }}>{p.name}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 2 }}>{p.subtitle}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 4 }}>${(p.price_cents/100).toFixed(0)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <TabBar />
      <HomeIndicator />
    </div>
  );
}
