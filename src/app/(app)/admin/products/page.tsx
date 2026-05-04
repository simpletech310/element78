import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: { deleted?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/products");
  const sb = createClient();
  const { data } = await sb.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
  const products = (data as Product[]) ?? [];

  return (
    <AdminShell
      pathname="/admin/products"
      title="SHOP"
      subtitle={`${products.length} PRODUCTS`}
      actions={<Link href="/admin/products/new" className="btn btn-sky" style={{ padding: "10px 16px" }}>+ NEW PRODUCT</Link>}
    >
      {searchParams.deleted && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          PRODUCT DELETED.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {products.length === 0 ? (
          <div className="e-mono" style={{ padding: 28, borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.18)", color: "rgba(242,238,232,0.55)", fontSize: 11, letterSpacing: "0.18em" }}>
            NO PRODUCTS YET.
          </div>
        ) : (
          products.map(p => {
            const trackedOut = p.stock_qty != null && p.stock_qty <= 0;
            const lowStock = p.stock_qty != null && p.stock_qty > 0 && p.stock_qty <= 5;
            const stockLabel = p.stock_qty == null ? "UNLIMITED" : `${p.stock_qty} ON HAND`;
            const visible = p.in_stock && !trackedOut;
            return (
              <Link key={p.id} href={`/admin/products/${p.id}`} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 16px", borderRadius: 14, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)", textDecoration: "none", color: "var(--bone)" }}>
                {p.hero_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.hero_image} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{p.name}</div>
                  <div className="e-mono" style={{ fontSize: 10, color: "rgba(242,238,232,0.55)", letterSpacing: "0.16em", marginTop: 4 }}>
                    /{p.slug} · {p.category ?? "uncategorized"}
                  </div>
                </div>
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: trackedOut ? "var(--rose)" : lowStock ? "var(--rose)" : "rgba(242,238,232,0.7)" }}>
                  {stockLabel}
                </div>
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: visible ? "var(--sky)" : "var(--rose)" }}>
                  {visible ? "ACTIVE" : "HIDDEN"}
                </div>
                <div className="e-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(242,238,232,0.7)" }}>
                  ${(p.price_cents / 100).toFixed(2)}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}
