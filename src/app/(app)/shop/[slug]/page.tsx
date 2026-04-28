import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBar, HomeIndicator } from "@/components/chrome/StatusBar";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { AddToBagFull } from "@/components/shop/AddToBag";
import { CartButton } from "@/components/shop/CartButton";
import { getProduct } from "@/lib/data/queries";

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const data = await getProduct(params.slug);
  if (!data) notFound();
  const { product, variants } = data;
  const gallery = product.gallery.length ? product.gallery : product.hero_image ? [product.hero_image] : [];

  const specs = [
    { l: "CAPACITY", v: product.subtitle?.split(" · ")[0] ?? "—" },
    { l: "MATERIAL", v: "STEEL" },
    { l: "COLD", v: "24 HRS" },
    { l: "WEIGHT", v: "14.2 OZ" },
  ];

  return (
    <div className="app" style={{ height: "100dvh" }}>
      <StatusBar />
      <div className="app-scroll" style={{ paddingBottom: 110 }}>
        <div style={{ position: "absolute", top: 50, left: 22, right: 22, zIndex: 10, display: "flex", justifyContent: "space-between" }}>
          <Link href="/shop" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(242,238,232,0.85)", backdropFilter: "blur(10px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(242,238,232,0.85)", backdropFilter: "blur(10px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={18} /></button>
            <CartButton />
          </div>
        </div>

        <div style={{ position: "relative", height: 540, background: "var(--bone-2)" }}>
          {gallery[0] && <Photo src={gallery[0]} alt={product.name} style={{ position: "absolute", inset: 0 }} />}
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
            {gallery.map((_, i) => (
              <div key={i} style={{ width: i === 0 ? 22 : 6, height: 6, borderRadius: 999, background: i === 0 ? "var(--ink)" : "rgba(10,14,20,0.3)" }} />
            ))}
          </div>
          {product.tag && (
            <div style={{ position: "absolute", top: 110, left: 22 }}>
              <span className="e-tag" style={{ background: "var(--ink)", color: "var(--sky)", padding: "5px 9px", borderRadius: 3 }}>{product.tag} · NEW</span>
            </div>
          )}
        </div>

        <div style={{ padding: "22px 22px 8px" }}>
          <div className="e-mono" style={{ color: "var(--electric-deep)" }}>{product.category?.toUpperCase()}</div>
          <div className="e-display" style={{ fontSize: 36, lineHeight: 0.92, marginTop: 6 }}>{product.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 26 }}>${(product.price_cents/100).toFixed(0)}</span>
            <span className="e-mono" style={{ color: "rgba(10,14,20,0.5)" }}>★ 4.9 · 184 REVIEWS</span>
          </div>

          <AddToBagFull product={product} variants={variants} />
        </div>

        <div style={{ padding: "20px 22px 4px" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 8 }}>WHY IT&apos;S DIFFERENT</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(10,14,20,0.78)" }}>{product.description}</div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {specs.map(s => (
              <div key={s.l} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--paper)", border: "1px solid rgba(10,14,20,0.06)" }}>
                <div className="e-mono" style={{ fontSize: 9, color: "rgba(10,14,20,0.5)" }}>{s.l}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, marginTop: 4 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {gallery[1] && (
          <div style={{ padding: "20px 22px 4px" }}>
            <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 10 }}>IN USE</div>
            <div style={{ borderRadius: 14, overflow: "hidden", height: 240, position: "relative" }}>
              <Photo src={gallery[1]} alt="" style={{ position: "absolute", inset: 0 }} />
            </div>
          </div>
        )}

        <div style={{ padding: "20px 22px 0" }}>
          <div className="e-mono" style={{ color: "rgba(10,14,20,0.5)", marginBottom: 12 }}>REVIEWS · 184</div>
          {[
            { n: "AALIYAH M.", r: 5, t: "Set up my morning Pilates film in seconds. The mount is cleaner than I expected." },
            { n: "SHAY D.", r: 5, t: "Holds cold all day at the gym." },
          ].map((r, i) => (
            <div key={i} style={{ padding: "14px 0", borderTop: "1px solid rgba(10,14,20,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 14 }}>{r.n}</span>
                <span className="e-mono" style={{ color: "var(--electric-deep)" }}>{"★".repeat(r.r)}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: "rgba(10,14,20,0.7)", lineHeight: 1.5 }}>{r.t}</div>
            </div>
          ))}
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}
