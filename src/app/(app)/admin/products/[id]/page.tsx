import { redirect } from "next/navigation";
import { AdminShell } from "@/components/site/AdminShell";
import { getAdminForCurrentUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { updateProductAction, deleteProductAction } from "@/lib/admin-actions";
import type { Product } from "@/lib/data/types";

export const dynamic = "force-dynamic";

export default async function AdminProductDetail({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; updated?: string; error?: string } }) {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/login?next=/admin/products");
  const sb = createClient();
  const { data } = await sb.from("products").select("*").eq("id", params.id).maybeSingle();
  if (!data) redirect("/admin/products?error=not_found");
  const p = data as Product;

  return (
    <AdminShell pathname="/admin/products" title={p.name} subtitle={`/${p.slug}`}>
      {(searchParams.created || searchParams.updated) && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(143,184,214,0.12)", border: "1px solid rgba(143,184,214,0.4)", color: "var(--sky)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.created ? "PRODUCT CREATED." : "SAVED."}
        </div>
      )}
      {searchParams.error && (
        <div className="e-mono" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(232,181,168,0.12)", border: "1px solid rgba(232,181,168,0.4)", color: "var(--rose)", fontSize: 11, letterSpacing: "0.16em" }}>
          {searchParams.error}
        </div>
      )}

      <form action={updateProductAction} style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 14, padding: 22, borderRadius: 16, background: "var(--haze)", border: "1px solid rgba(143,184,214,0.2)" }}>
        <input type="hidden" name="product_id" value={p.id} />
        <Field label="NAME *"><input name="name" required defaultValue={p.name} className="ta-input" /></Field>
        <Field label="SUBTITLE"><input name="subtitle" defaultValue={p.subtitle ?? ""} className="ta-input" /></Field>
        <Field label="CATEGORY"><input name="category" defaultValue={p.category ?? ""} className="ta-input" /></Field>
        <Field label="DESCRIPTION"><textarea name="description" rows={3} defaultValue={p.description ?? ""} className="ta-input" style={{ resize: "vertical" }} /></Field>
        <Field label="HERO IMAGE URL"><input name="hero_image" defaultValue={p.hero_image ?? ""} className="ta-input" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="PRICE · USD *"><input name="price_dollars" type="number" min={0} step="0.01" defaultValue={(p.price_cents / 100).toFixed(2)} required className="ta-input" /></Field>
          <Field label="COMPARE AT · USD"><input name="compare_at_dollars" type="number" min={0} step="0.01" defaultValue={p.compare_at_cents != null ? (p.compare_at_cents / 100).toFixed(2) : ""} className="ta-input" /></Field>
        </div>
        <Field label="TAG"><input name="tag" defaultValue={p.tag ?? ""} className="ta-input" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="SORT ORDER"><input name="sort_order" type="number" defaultValue={p.sort_order} className="ta-input" /></Field>
          <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>
            IN STOCK
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderRadius: 10, background: "rgba(10,14,20,0.4)", border: "1px solid rgba(143,184,214,0.25)" }}>
              <input type="checkbox" name="in_stock" defaultChecked={p.in_stock} /> AVAILABLE
            </label>
          </label>
        </div>
        <div><button type="submit" className="btn btn-sky" style={{ padding: "12px 22px" }}>SAVE →</button></div>
      </form>

      <form action={deleteProductAction} style={{ marginTop: 22 }}>
        <input type="hidden" name="product_id" value={p.id} />
        <button type="submit" className="e-tag" style={{ padding: "10px 16px", borderRadius: 999, background: "transparent", border: "1px solid rgba(232,181,168,0.5)", color: "var(--rose)", cursor: "pointer" }}>
          DELETE PRODUCT
        </button>
      </form>

      <style>{`
        .ta-input { padding: 11px 13px; border-radius: 10px; background: rgba(10,14,20,0.4); border: 1px solid rgba(143,184,214,0.25); color: var(--bone); font-family: var(--font-body); font-size: 14px; width: 100%; }
        .ta-input:focus { outline: none; border-color: var(--sky); }
      `}</style>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="e-mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 9, color: "rgba(242,238,232,0.6)", letterSpacing: "0.2em" }}>{label}{children}</label>;
}
