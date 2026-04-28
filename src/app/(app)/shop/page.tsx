import Link from "next/link";
import { Navbar } from "@/components/site/Navbar";
import { TabBar } from "@/components/chrome/TabBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { CartButton } from "@/components/shop/CartButton";
import { AddToBagInline } from "@/components/shop/AddToBag";
import { listProducts } from "@/lib/data/queries";
import { getUser } from "@/lib/auth";

export default async function ShopScreen() {
  const [products, user] = await Promise.all([listProducts(), getUser()]);
  const isAuthed = !!user;
  const hero = products.find(p => p.slug === "element-set") ?? products[0];
  const grid = products.filter(p => p.id !== hero?.id);
  const cats = [{ l: "ALL", a: true }, { l: "WEAR" }, { l: "GEAR" }, { l: "FUEL" }, { l: "ACCESSORIES" }];

  return (
    <div style={{ background: "var(--bone)", color: "var(--ink)", fontFamily: "var(--font-body)", minHeight: "100dvh", paddingBottom: isAuthed ? 80 : 0 }}>
      {!isAuthed && <Navbar />}

      <section style={{ padding: "32px 22px 12px", maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>STORE · SS26</div>
          <h1 className="e-display" style={{ fontSize: "clamp(48px, 9vw, 88px)", marginTop: 8, lineHeight: 0.92 }}>SHOP THE DROP.</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/shop/gallery" aria-label="Search shop" style={{ width: 44, height: 44, borderRadius: 999, background: "var(--ink)", color: "var(--bone)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></Link>
          <CartButton />
        </div>
      </section>

      {hero && (
        <section style={{ padding: "12px 22px 24px", maxWidth: 1180, margin: "0 auto" }}>
          <Link href={`/shop/${hero.slug}`} className="lift" style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 520, display: "block", color: "var(--bone)", textDecoration: "none", border: "1px solid rgba(10,14,20,0.06)" }}>
            <Photo src={hero.hero_image ?? ""} alt={hero.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(10,14,20,0.95) 100%)" }} />
            {hero.tag && (
              <div style={{ position: "absolute", top: 18, left: 18 }}>
                <span className="e-tag" style={{ background: "var(--sky)", color: "var(--ink)", padding: "6px 11px", borderRadius: 999 }}>NEW DROP · 04.27</span>
              </div>
            )}
            <div style={{ position: "absolute", left: 22, right: 22, bottom: 24, maxWidth: 560 }}>
              <div className="e-mono" style={{ color: "var(--sky)", marginBottom: 8 }}>{hero.subtitle}</div>
              <div className="e-display" style={{ fontSize: "clamp(40px, 7vw, 64px)", lineHeight: 0.95 }}>
                IN MY{" "}
                <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>element.</span>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>${(hero.price_cents/100).toFixed(0)}</span>
                {hero.compare_at_cents && (
                  <span style={{ fontSize: 13, color: "rgba(242,238,232,0.55)", textDecoration: "line-through" }}>${(hero.compare_at_cents/100).toFixed(0)}</span>
                )}
                <span className="btn btn-bone" style={{ marginLeft: "auto" }}>
                  <Icon name="bag" size={14} />SHOP THE SET
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      <section style={{ padding: "0 22px 12px", maxWidth: 1180, margin: "0 auto" }}>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {cats.map(c => (
            <div key={c.l} className="e-tag" style={{
              padding: "8px 14px", borderRadius: 999,
              background: c.a ? "var(--ink)" : "transparent",
              color: c.a ? "var(--bone)" : "var(--ink)",
              border: c.a ? "none" : "1px solid rgba(10,14,20,0.15)",
              whiteSpace: "nowrap", cursor: "pointer",
            }}>{c.l}</div>
          ))}
        </div>
      </section>

      <section style={{ padding: "12px 22px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {grid.map(p => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="lift" style={{ color: "var(--ink)", textDecoration: "none" }}>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "0.82", background: "var(--bone-2)" }}>
                <Photo src={p.hero_image ?? ""} alt={p.name} className="zoom-on-hover" style={{ position: "absolute", inset: 0 }} />
                {p.tag && (
                  <div style={{ position: "absolute", top: 10, left: 10 }}>
                    <span className="e-tag" style={{ background: "var(--bone)", color: "var(--ink)", padding: "4px 8px", borderRadius: 3, fontSize: 8 }}>{p.tag}</span>
                  </div>
                )}
                <AddToBagInline product={p} />
              </div>
              <div style={{ padding: "10px 2px 0" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: "0.02em" }}>{p.name}</div>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)", marginTop: 4 }}>{p.subtitle}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, marginTop: 6 }}>${(p.price_cents/100).toFixed(0)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {isAuthed && <TabBar />}
    </div>
  );
}
